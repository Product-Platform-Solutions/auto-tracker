interface EnrichedTicket {
  title: string;
  description: string;
  type: string;
  priority: string;
  labels: string[];
  acceptanceCriteria: string[];
  ticketId: string;
}

export function enrichFromBranch(branch: string, commit: string, author: string): EnrichedTicket {
  const parts = branch.split('/');
  const prefix = parts[0]?.toLowerCase() || 'chore';
  const rest = parts.slice(1).join(' ');

  // Extract ticket ID e.g. IAM-001
  const ticketIdMatch = rest.match(/[A-Z]+-[0-9]+/);
  const ticketId = ticketIdMatch ? ticketIdMatch[0] : '';

  // Clean title from branch name
  const titleRaw = rest
    .replace(/[A-Z]+-[0-9]+-?/, '')
    .replace(/-/g, ' ')
    .trim();
  const title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1);

  // Determine type
  const typeMap: Record<string, string> = {
    'feat': 'Feature',
    'fix': 'Bug Fix',
    'hotfix': 'Hotfix',
    'chore': 'Chore',
    'docs': 'Documentation',
    'refactor': 'Refactor',
    'test': 'Test',
    'ci': 'CI/CD'
  };
  const type = typeMap[prefix] || 'Task';

  // Determine priority
  const priorityMap: Record<string, string> = {
    'hotfix': 'Critical',
    'fix': 'High',
    'feat': 'Medium',
    'chore': 'Low',
    'docs': 'Low'
  };
  const priority = priorityMap[prefix] || 'Medium';

  // Generate labels
  const labels = [prefix, priority.toLowerCase()];

  // Generate acceptance criteria from keywords
  const keywords = titleRaw.toLowerCase().split(' ');
  const acceptanceCriteria = generateAcceptanceCriteria(keywords, type);

  // Generate description
  const description = `## ${title}

**Type:** ${type}
**Priority:** ${priority}
**Branch:** \`${branch}\`
**Commit:** \`${commit}\`
**Author:** @${author}

## Description
${generateDescription(title, type, keywords)}

## Acceptance Criteria
${acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}
`;

  return {
    title,
    description,
    type,
    priority,
    labels,
    acceptanceCriteria,
    ticketId
  };
}

function generateDescription(title: string, type: string, keywords: string[]): string {
  if (type === 'Bug Fix' || type === 'Hotfix') {
    return `This ${type.toLowerCase()} addresses an issue with ${title.toLowerCase()}. The fix ensures correct behavior and prevents regression.`;
  }
  if (type === 'Feature') {
    return `This feature implements ${title.toLowerCase()}. It extends the platform capabilities and improves the user experience.`;
  }
  return `This change covers ${title.toLowerCase()} as part of ongoing platform improvements.`;
}

function generateAcceptanceCriteria(keywords: string[], type: string): string[] {
  const criteria: string[] = [];

  if (type === 'Feature') {
    criteria.push(`Feature is implemented and working as expected`);
    criteria.push(`Unit tests are written and passing`);
    criteria.push(`Code is reviewed and approved`);
    criteria.push(`Documentation is updated`);
  } else if (type === 'Bug Fix' || type === 'Hotfix') {
    criteria.push(`Bug is reproduced and root cause identified`);
    criteria.push(`Fix is implemented and verified`);
    criteria.push(`Regression test added to prevent recurrence`);
    criteria.push(`No new issues introduced by the fix`);
  } else {
    criteria.push(`Changes are implemented correctly`);
    criteria.push(`All existing tests pass`);
    criteria.push(`Code is reviewed and approved`);
  }

  // Add keyword-specific criteria
  if (keywords.includes('sso') || keywords.includes('auth') || keywords.includes('login')) {
    criteria.push(`Authentication flow works correctly end to end`);
    criteria.push(`Security implications reviewed`);
  }
  if (keywords.includes('api')) {
    criteria.push(`API endpoints documented`);
    criteria.push(`Error handling implemented`);
  }
  if (keywords.includes('ui') || keywords.includes('frontend')) {
    criteria.push(`UI is responsive and accessible`);
    criteria.push(`Cross-browser testing completed`);
  }

  return criteria;
}
