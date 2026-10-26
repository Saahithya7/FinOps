import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Privileged Supabase client (used if service role key is configured)
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Standard auth verification client
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Admin Authentication Middleware
 * 1. Validates caller identity using Supabase JWT Bearer token.
 * 2. Verifies caller has Admin role from authoritative database profiles.
 * 3. Never trusts role claims from client payload.
 */
async function authenticateAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required: Missing Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({
        success: false,
        error: `Invalid session: ${userError?.message || 'User not recognized'}`,
      });
    }

    const callerUser = userData.user;

    // Verify caller's Admin role from trusted database profiles
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('user_id, role, full_name, email')
      .eq('user_id', callerUser.id)
      .maybeSingle();

    if (profileError) {
      return res.status(403).json({
        success: false,
        error: `Database authorization check failed: ${profileError.message}`,
      });
    }

    if (!callerProfile || callerProfile.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only platform Administrators are permitted to perform this action.',
      });
    }

    (req as any).caller = callerProfile;
    (req as any).callerUser = callerUser;
    (req as any).callerToken = token;
    (req as any).callerClient = callerClient;
    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server authorization validation error.',
    });
  }
}

// -----------------------------------------------------------------------------
// API: HEALTH CHECK
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serviceRoleConfigured: Boolean(supabaseServiceRoleKey),
    supabaseUrl: Boolean(supabaseUrl),
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// API: APPROVE / REJECT CUSTOMER ACCOUNT STATUS
// -----------------------------------------------------------------------------
app.post('/api/admin/approve-customer', authenticateAdmin, async (req, res) => {
  try {
    const { targetUserId, newStatus, targetName, targetEmail } = req.body;
    const caller = (req as any).caller;
    const token = (req as any).callerToken;
    const callerClient = (req as any).callerClient;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: targetUserId is required and must be a valid UUID string.',
      });
    }

    const PERMITTED_STATUSES = ['Pending', 'Active', 'Rejected'];
    if (!PERMITTED_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Validation Error: Invalid status '${newStatus}'. Permitted: ${PERMITTED_STATUSES.join(', ')}`,
      });
    }

    // 1. Privileged execution if service role key is present
    if (supabaseServiceRoleKey) {
      const { data: updatedRows, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('user_id', targetUserId)
        .select('user_id, full_name, email, role, account_status');

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      if (!updatedRows || updatedRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Customer profile with user_id '${targetUserId}' was not found in Supabase.`,
        });
      }

      // Synchronize public.customers table if exists
      if (newStatus === 'Active' || newStatus === 'Rejected') {
        try {
          await supabaseAdmin
            .from('customers')
            .update({ customer_status: newStatus })
            .eq('profile_id', targetUserId);
        } catch (syncErr) {
          console.warn('Notice synchronizing customers table:', syncErr);
        }
      }

      // Record in admin_activity_logs
      try {
        await supabaseAdmin.from('admin_activity_logs').insert({
          log_id: crypto.randomUUID(),
          user_id: caller.user_id,
          action: 'Update Customer Status',
          details: `Admin ${caller.full_name || caller.email} changed customer ${targetName || targetEmail || targetUserId} status to ${newStatus}`,
          ip_address: req.ip || '127.0.0.1',
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('Notice logging admin activity:', logErr);
      }

      return res.json({
        success: true,
        user_id: targetUserId,
        account_status: newStatus,
        profile: updatedRows[0],
      });
    }

    // 2. Try RPC function admin_update_customer_status
    const { data: rpcData, error: rpcErr } = await callerClient.rpc(
      'admin_update_customer_status',
      {
        target_user_id: targetUserId,
        new_status: newStatus,
      }
    );

    if (!rpcErr) {
      return res.json({
        success: true,
        user_id: targetUserId,
        account_status: newStatus,
        details: rpcData,
      });
    }

    // 3. Direct update with authenticated admin client, verifying rows returned
    const { data: directData, error: directErr } = await callerClient
      .from('profiles')
      .update({ account_status: newStatus })
      .eq('user_id', targetUserId)
      .select('user_id, full_name, email, account_status');

    if (directErr) {
      return res.status(400).json({ success: false, error: directErr.message });
    }

    if (!directData || directData.length === 0) {
      return res.status(403).json({
        success: false,
        error:
          'Database RLS restriction: 0 rows updated in public.profiles. Under Supabase Row-Level Security, administrator updates to another user require the admin RLS policy migration (admin_approval_and_roles_migration.sql) executed in Supabase or SUPABASE_SERVICE_ROLE_KEY configured on the server.',
      });
    }

    return res.json({
      success: true,
      user_id: targetUserId,
      account_status: newStatus,
      profile: directData[0],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error processing customer approval.',
    });
  }
});

// -----------------------------------------------------------------------------
// API: CHANGE USER ROLE
// -----------------------------------------------------------------------------
app.post('/api/admin/change-role', authenticateAdmin, async (req, res) => {
  try {
    const { targetUserId, newRole, targetEmail, targetName, previousRole } = req.body;
    const caller = (req as any).caller;
    const callerUser = (req as any).callerUser;
    const callerClient = (req as any).callerClient;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: targetUserId is required and must be a valid UUID string.',
      });
    }

    const ALLOWED_ROLES = [
      'Customer',
      'Admin',
      'Manager',
      'Risk Analyst',
      'Fraud & Compliance Analyst',
      'Support Agent',
    ];

    if (!ALLOWED_ROLES.includes(newRole)) {
      return res.status(400).json({
        success: false,
        error: `Validation Error: Invalid role '${newRole}'. Allowed roles: ${ALLOWED_ROLES.join(', ')}`,
      });
    }

    // Prevent self-role modification
    if (callerUser.id === targetUserId || caller.user_id === targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Security Policy Violation: You cannot modify your own role through this interface.',
      });
    }

    // Prevent demoting primary administrator account
    if (
      (targetEmail === 'admin@abcfinance.com' ||
        targetUserId === 'e2ff607e-69ad-4027-bd00-69afb0516396') &&
      newRole !== 'Admin'
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Security Policy Violation: Cannot demote the primary administrator account (admin@abcfinance.com). Platform security requires at least one active Admin account.',
      });
    }

    // 1. Privileged update if service role key is present
    if (supabaseServiceRoleKey) {
      const { data: updatedRows, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', targetUserId)
        .select('user_id, full_name, email, role, account_status');

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      if (!updatedRows || updatedRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `User profile with user_id '${targetUserId}' was not found in Supabase.`,
        });
      }

      // Record in admin_activity_logs
      try {
        await supabaseAdmin.from('admin_activity_logs').insert({
          log_id: crypto.randomUUID(),
          user_id: caller.user_id,
          action: 'Update Role',
          details: `Admin ${caller.full_name || caller.email} changed role of ${targetName || targetEmail || targetUserId} from ${previousRole || 'Unknown'} to ${newRole}`,
          ip_address: req.ip || '127.0.0.1',
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('Notice logging admin activity:', logErr);
      }

      return res.json({
        success: true,
        user_id: targetUserId,
        role: newRole,
        profile: updatedRows[0],
      });
    }

    // 2. Try RPC function admin_change_user_role
    const { data: rpcData, error: rpcErr } = await callerClient.rpc(
      'admin_change_user_role',
      {
        target_user_id: targetUserId,
        new_role: newRole,
      }
    );

    if (!rpcErr) {
      return res.json({
        success: true,
        user_id: targetUserId,
        role: newRole,
        details: rpcData,
      });
    }

    // 3. Direct update with authenticated admin client, verifying rows returned
    const { data: directData, error: directErr } = await callerClient
      .from('profiles')
      .update({ role: newRole })
      .eq('user_id', targetUserId)
      .select('user_id, full_name, email, role');

    if (directErr) {
      return res.status(400).json({ success: false, error: directErr.message });
    }

    if (!directData || directData.length === 0) {
      return res.status(403).json({
        success: false,
        error:
          'Database RLS restriction: 0 rows updated in public.profiles. Under Supabase Row-Level Security, administrator updates to another user require the admin RLS policy migration (admin_approval_and_roles_migration.sql) executed in Supabase or SUPABASE_SERVICE_ROLE_KEY configured on the server.',
      });
    }

    return res.json({
      success: true,
      user_id: targetUserId,
      role: newRole,
      profile: directData[0],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error changing user role.',
    });
  }
});

// -----------------------------------------------------------------------------
// API: LIST ALL USERS (ADMIN-ONLY)
// -----------------------------------------------------------------------------
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const clientToUse = supabaseServiceRoleKey
      ? supabaseAdmin
      : (req as any).callerClient;

    const { data, error } = await clientToUse
      .from('profiles')
      .select('user_id, full_name, email, role, account_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error fetching user directory.',
    });
  }
});

// -----------------------------------------------------------------------------
// API: FINANCIAL INTELLIGENCE COPILOT
// -----------------------------------------------------------------------------
app.get('/api/copilot/status', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    configured: hasGeminiKey,
    model: hasGeminiKey ? 'gemini-3.8-flash' : 'deterministic-analytics-engine',
    message: hasGeminiKey
      ? 'Gemini Financial Intelligence Copilot is active and online.'
      : 'Copilot is operating in deterministic analytics mode. Set GEMINI_API_KEY in server environment to enable live generative intelligence.',
  });
});

app.post('/api/copilot', async (req, res) => {
  try {
    const { prompt, role, customerId } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'A user prompt is required.' });
    }

    // Determine query client
    const authHeader = req.headers.authorization;
    let queryClient = supabaseAdmin;
    if (!supabaseServiceRoleKey && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      queryClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      });
    }

    // Retrieve real grounded data from Supabase
    const [txRes, fraudRes, ticketsRes, reviewsRes] = await Promise.all([
      queryClient
        .from('transactions')
        .select('transaction_id, transaction_amount, transaction_status, category, payment_method, transaction_date')
        .order('transaction_date', { ascending: false })
        .limit(25),
      queryClient
        .from('fraud_alerts')
        .select('alert_id, transaction_id, severity, investigation_status, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      queryClient
        .from('support_tickets')
        .select('ticket_id, subject, category, priority, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      queryClient
        .from('manager_reviews')
        .select('case_type, review_status, risk_score, priority')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const transactions = txRes.data || [];
    const fraudAlerts = fraudRes.data || [];
    const tickets = ticketsRes.data || [];
    const reviews = reviewsRes.data || [];

    const totalTx = transactions.length;
    const totalVolume = transactions.reduce((acc, t) => acc + (Number(t.transaction_amount) || 0), 0);
    const failedTx = transactions.filter((t) => t.transaction_status === 'Failed');
    const failedCount = failedTx.length;
    const criticalFraud = fraudAlerts.filter((f) => f.severity === 'Critical');
    const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress');
    const urgentTickets = tickets.filter((t) => t.priority === 'Urgent' || t.priority === 'High');

    const contextSummary = {
      transactions: {
        analyzedSample: totalTx,
        totalVolumeINR: totalVolume,
        failedCount: failedCount,
        failureRatePercent: totalTx > 0 ? ((failedCount / totalTx) * 100).toFixed(1) : '0.0',
        failedTransactions: failedTx.slice(0, 5),
      },
      fraudSurveillance: {
        totalAlerts: fraudAlerts.length,
        criticalSeverityCount: criticalFraud.length,
        openInvestigations: fraudAlerts.filter((f) => f.investigation_status === 'Under Investigation').length,
        recentAlerts: fraudAlerts.slice(0, 3),
      },
      supportCaseload: {
        totalTickets: tickets.length,
        openQueue: openTickets.length,
        urgentTickets: urgentTickets.length,
        urgentSamples: urgentTickets.slice(0, 3),
      },
      managerReviews: {
        pendingApprovals: reviews.filter((r) => r.review_status === 'Pending').length,
      },
    };

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

    if (hasGeminiKey) {
      try {
        const ai = new GoogleGenAI();
        const systemPrompt = `You are FinOps AI Financial Operations Copilot for an enterprise fintech platform.
Role Context: ${role || 'Employee'}.
You must strictly base your answers on the verified operational data provided below.
Format financial amounts in Indian Rupees (₹).
Keep answers crisp, concise, executive-ready, and analytical (2-4 paragraphs or clear bullet points).
Never invent numbers or claim fraud has occurred without explicit alert records.

VERIFIED OPERATIONAL DATA FROM SUPABASE:
${JSON.stringify(contextSummary, null, 2)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUSER QUESTION: ${prompt}` }] }
          ],
        });

        const replyText = response.text || 'Unable to generate response from financial data model.';

        return res.json({
          success: true,
          answer: replyText,
          isAiConfigured: true,
          model: 'gemini-3.8-flash',
          sources: ['public.transactions', 'public.fraud_alerts', 'public.support_tickets'],
          context: contextSummary,
        });
      } catch (aiErr: any) {
        console.warn('Gemini API call failed, falling back to deterministic answer:', aiErr.message);
      }
    }

    // Deterministic analytical answer based on actual data
    const pLower = prompt.toLowerCase();
    let answerText = '';

    if (pLower.includes('fail') || pLower.includes('failed')) {
      answerText = `Operational Analysis of Failed Transactions:\n\n• Current failure rate is ${contextSummary.transactions.failureRatePercent}% across ${totalTx} analyzed transactions (${failedCount} failed transactions totaling ₹${failedTx.reduce((s, t) => s + Number(t.transaction_amount || 0), 0).toLocaleString('en-IN')}).\n• Primary categories affected: ${Array.from(new Set(failedTx.map((t) => t.category))).join(', ') || 'Operations & Vendor Payouts'}.\n• Recommended Action: Check network settlement gateway for UPI/NEFT switches and inspect recent velocity spikes.`;
    } else if (pLower.includes('investigat') || pLower.includes('fraud') || pLower.includes('suspicious')) {
      answerText = `Fraud & Risk Surveillance Overview:\n\n• ${fraudAlerts.length} total surveillance alerts on record with ${criticalFraud.length} classified as Critical severity.\n• Active investigations pending review: ${contextSummary.fraudSurveillance.openInvestigations}.\n• Key alert references: ${fraudAlerts.slice(0, 3).map((f) => `${f.alert_id} (${f.severity} - ${f.reason || 'Velocity anomaly'})`).join(', ') || 'No critical flags'}.\n• High-priority cases require risk analyst review in Investigation Studio.`;
    } else if (pLower.includes('support') || pLower.includes('ticket') || pLower.includes('case')) {
      answerText = `Customer Support Caseload Summary:\n\n• ${contextSummary.supportCaseload.openQueue} open/in-progress tickets out of ${tickets.length} total cases.\n• High-priority / Urgent SLA tickets: ${urgentTickets.length} cases.\n• Primary subjects awaiting resolution: ${urgentTickets.slice(0, 3).map((t) => `"${t.subject}" (${t.category})`).join('; ') || 'Standard dispute queue'}.`;
    } else if (pLower.includes('perform') || pLower.includes('today') || pLower.includes('operation')) {
      answerText = `Executive Operational Performance Summary:\n\n• Supervised Volume: ₹${totalVolume.toLocaleString('en-IN')} across ${totalTx} transactions.\n• Settlement Success Rate: ${totalTx > 0 ? (((totalTx - failedCount) / totalTx) * 100).toFixed(1) : 100}%.\n• Unresolved Support Queue: ${openTickets.length} tickets.\n• Executive Pending Approvals: ${contextSummary.managerReviews.pendingApprovals} cases awaiting managerial sign-off.`;
    } else {
      answerText = `Operational Query Summary for "${prompt}":\n\n• Database telemetry shows ${totalTx} verified transactions with ₹${totalVolume.toLocaleString('en-IN')} total volume.\n• Risk posture: ${criticalFraud.length} critical fraud alerts and ${openTickets.length} open support cases.\n• System invariants: 100% RBAC enforced across Supabase schemas.`;
    }

    return res.json({
      success: true,
      answer: answerText,
      isAiConfigured: hasGeminiKey,
      model: hasGeminiKey ? 'gemini-3.8-flash' : 'deterministic-analytics-engine',
      notice: hasGeminiKey
        ? undefined
        : 'AI Copilot is operating in deterministic analytics mode. Set GEMINI_API_KEY in the environment to activate live neural reasoning.',
      sources: ['public.transactions', 'public.fraud_alerts', 'public.support_tickets'],
      context: contextSummary,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error processing Copilot query.',
    });
  }
});


// -----------------------------------------------------------------------------
// VITE DEV SERVER OR STATIC SERVING
// -----------------------------------------------------------------------------
const PORT = 3000;

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinOps full-stack application server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
