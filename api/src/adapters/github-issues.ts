import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

export async function createOrUpdateIssue(
  repo: string,
  ticket: any,
  status: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('GitHub token not set');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  // Build full issue body
  const issueBody = `## ${ticket.title}

**Type:** ${ticket.type}
**Priority:** ${ticket.priority}
**Branch:** \`${ticket.branch || 'N/A'}\`
**Commit:** \`${ticket.commit || 'N/A'}\`
**Author:** @${ticket.author || 'N/A'}
**Ticket ID:** ${ticket.ticketId || 'N/A'}

## Description
${ticket.description}

## Acceptance Criteria
${ticket.acceptanceCriteria.map((c: string) => `- [ ] ${c}`).join('\n')}
`;

  try {
    const searchQuery = ticket.ticketId 
      ? `${ticket.ticketId} in:title repo:${repo}`
      : `${ticket.title} in:title repo:${repo}`;
      
    const searchRes = await axios.get(
      `${GITHUB_API}/search/issues?q=${encodeURIComponent(searchQuery)}`,
      { headers }
    );

    const existing = searchRes.data.items[0];

    if (existing && status !== 'in_progress') {
      await axios.post(
        `${GITHUB_API}/repos/${repo}/issues/${existing.number}/comments`,
        {
          body: `**Status Update: ${status.replace('_', ' ').toUpperCase()}**\n\n${issueBody}`
        },
        { headers }
      );
      console.log(`✅ Updated issue #${existing.number}`);
    } else if (!existing) {
      await axios.post(
        `${GITHUB_API}/repos/${repo}/issues`,
        {
          title: ticket.ticketId ? `[${ticket.ticketId}] ${ticket.title}` : ticket.title,
          body: issueBody,
          labels: ticket.labels
        },
        { headers }
      );
      console.log(`✅ Created new issue: ${ticket.title}`);
    }
  } catch (error: any) {
    console.error('GitHub adapter error:', error.message);
  }
}
