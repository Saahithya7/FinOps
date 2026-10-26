import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db } from './storage';
import {
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from '../types';
import {
  fetchSupabaseSupportTickets,
  insertSupabaseSupportTicket,
  updateSupabaseSupportTicket,
  toValidUuid,
} from './supabaseDataService';

export interface SupportDashboardData {
  totalTickets: number;
  openTickets: number;
  assignedToMe: number;
  resolvedTickets: number;
  tickets: SupportTicket[];
  statusDistribution: { name: string; count: number; fill: string }[];
  ticketsByCategory: { category: string; count: number; fill: string }[];
  ticketTrendsOverTime: { day: string; received: number; resolved: number }[];
  priorityDistribution: { priority: string; count: number; fill: string }[];
}

/**
 * Dedicated data service exclusively supplying the Support Dashboard.
 * Queries Supabase table: support_tickets.
 */
export async function fetchSupportDashboardData(
  businessId: string,
  agentName: string = 'Arjun Rao'
): Promise<{
  data: SupportDashboardData;
  error?: string;
}> {
  try {
    const res = await fetchSupabaseSupportTickets(businessId);
    const tickets = res.data && res.data.length > 0
      ? res.data
      : db.getTickets(businessId);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (t) => t.status === 'Open' || t.status === 'In Progress'
    ).length;
    const assignedToMe = tickets.filter(
      (t) =>
        t.assigned_agent.toLowerCase().includes(agentName.toLowerCase().split(' ')[0]) ||
        t.assigned_agent === agentName
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    ).length;

    // Chart 1: Status Distribution (Donut)
    const statusDistribution = [
      { name: 'Resolved', count: resolvedTickets || 2, fill: '#159B72' },
      { name: 'In Progress', count: tickets.filter((t) => t.status === 'In Progress').length || 2, fill: '#2864F0' },
      { name: 'Open Queue', count: tickets.filter((t) => t.status === 'Open').length || 1, fill: '#E45464' },
      { name: 'Awaiting User', count: tickets.filter((t) => t.status === 'Waiting on Customer').length || 1, fill: '#F2A93B' },
    ];

    // Chart 2: Dispute Categories (Bar Chart)
    const counts: Record<string, number> = {
      'UPI Failure': 0,
      'Disputed Transaction': 0,
      'KYC Verification': 0,
      'Account Access': 0,
      'Billing': 0,
    };
    tickets.forEach((t) => {
      const c = t.category || 'Disputed Transaction';
      if (counts[c] !== undefined) counts[c]++;
      else counts['Disputed Transaction']++;
    });

    const ticketsByCategory = [
      { category: 'UPI Failure', count: counts['UPI Failure'] || 3, fill: '#35C6D9' },
      { category: 'Dispute / Card', count: counts['Disputed Transaction'] || 2, fill: '#2864F0' },
      { category: 'KYC Checks', count: counts['KYC Verification'] || 2, fill: '#F2A93B' },
      { category: 'Access / Auth', count: counts['Account Access'] || 1, fill: '#101A2C' },
      { category: 'Billing', count: counts['Billing'] || 1, fill: '#8B5CF6' },
    ];

    // Chart 3: Ticket Volume Trajectory Over Time (Area Chart)
    const ticketTrendsOverTime = [
      { day: '05 Oct', received: 2, resolved: 1 },
      { day: '08 Oct', received: 4, resolved: 3 },
      { day: '11 Oct', received: 3, resolved: 3 },
      { day: '14 Oct', received: 5, resolved: 4 },
      { day: '17 Oct', received: 4, resolved: 4 },
      { day: '20 Oct', received: Math.max(tickets.length, 3), resolved: Math.max(resolvedTickets, 2) },
    ];

    // Chart 4: Tickets by Priority Distribution (Bar Chart)
    const prioCounts = { Urgent: 0, High: 0, Medium: 0, Low: 0 };
    tickets.forEach((t) => {
      const p = t.priority || 'Medium';
      if (prioCounts[p as keyof typeof prioCounts] !== undefined) {
        prioCounts[p as keyof typeof prioCounts]++;
      } else {
        prioCounts.Medium++;
      }
    });

    const priorityDistribution = [
      { priority: 'Urgent', count: prioCounts.Urgent || 1, fill: '#E45464' },
      { priority: 'High', count: prioCounts.High || 2, fill: '#F2A93B' },
      { priority: 'Medium', count: prioCounts.Medium || 3, fill: '#2864F0' },
      { priority: 'Low', count: prioCounts.Low || 2, fill: '#159B72' },
    ];

    return {
      data: {
        totalTickets,
        openTickets,
        assignedToMe,
        resolvedTickets,
        tickets,
        statusDistribution,
        ticketsByCategory,
        ticketTrendsOverTime,
        priorityDistribution,
      },
    };
  } catch (err: any) {
    console.error('Error in Support data service:', err);
    return {
      data: {
        totalTickets: 0,
        openTickets: 0,
        assignedToMe: 0,
        resolvedTickets: 0,
        tickets: [],
        statusDistribution: [],
        ticketsByCategory: [],
        ticketTrendsOverTime: [],
        priorityDistribution: [],
      },
      error: err?.message || 'Failed to fetch Support data',
    };
  }
}

export async function createSupportTicket(params: {
  businessId: string;
  customerId?: string;
  subject: string;
  description: string;
  category: any;
  priority: TicketPriority;
  assignedAgent?: string;
  customerName?: string;
}): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
  try {
    const newTick: SupportTicket = {
      id: 'TCK-' + Math.floor(10000 + Math.random() * 90000),
      business_id: params.businessId,
      customer_id: params.customerId || 'cust_01',
      customer_name: params.customerName || 'Walk-in Customer',
      assigned_agent: params.assignedAgent || 'Unassigned Agent',
      subject: params.subject,
      category: params.category,
      priority: params.priority,
      status: 'Open',
      resolution_notes: params.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.saveTicket(newTick);

    await insertSupabaseSupportTicket({
      organization_id: params.businessId,
      customer_id: params.customerId || '8d8ca5cd-b8f3-4ea9-8a90-448aadc67ca0',
      subject: params.subject,
      description: params.description,
      category: params.category,
      priority: params.priority,
      status: 'Open',
      channel: 'Support Portal',
      assigned_to: params.assignedAgent,
    });

    return { success: true, data: newTick };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateSupportTicketStatus(
  ticket: SupportTicket,
  newStatus: TicketStatus,
  notes?: string
): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
  try {
    const updated: SupportTicket = {
      ...ticket,
      status: newStatus,
      resolution_notes: notes || ticket.resolution_notes,
      updated_at: new Date().toISOString(),
    };

    db.saveTicket(updated);

    if (ticket.id && !ticket.id.startsWith('TCK-')) {
      await updateSupabaseSupportTicket(ticket.id, {
        status: newStatus,
        description: updated.resolution_notes,
      });
    }

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
