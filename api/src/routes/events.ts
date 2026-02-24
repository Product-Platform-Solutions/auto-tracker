import { Router, Request, Response } from 'express';
import { enrichFromBranch } from '../services/enrichment';
import { enrichWithGroq } from '../services/groq';
import { createOrUpdateIssue } from '../adapters/github-issues';

export const eventRouter = Router();

eventRouter.post('/github', async (req: Request, res: Response) => {
  try {
    const {
      event,
      status,
      branch,
      commit,
      author,
      repo,
      ticket_id,
      pr_url,
      pr_title,
      timestamp
    } = req.body;

    console.log(`📥 Received event: ${event} | status: ${status} | branch: ${branch}`);

    // Skip if no branch info
    if (!branch || branch === 'undefined') {
      return res.json({ status: 'skipped', reason: 'no branch info' });
    }

    // Rule-based enrichment
    let ticket = enrichFromBranch(branch, commit, author);

    // Override ticket ID if provided
    if (ticket_id) ticket.ticketId = ticket_id;

    // AI enrichment via Groq (falls back to rule-based if unavailable)
    ticket = await enrichWithGroq(branch, commit, author, ticket) as typeof ticket;

    // Route to adapter based on config
    const adapter = process.env.TRACKER_ADAPTER || 'github-issues';

    if (adapter === 'github-issues' && repo) {
      await createOrUpdateIssue(repo, ticket, status);
    }

    res.json({
      status: 'processed',
      ticket,
      adapter,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Event processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
