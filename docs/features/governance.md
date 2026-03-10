# Governance

DAO proposal management, voting, and delegation system.

**Source:** `client/src/pages/governance.tsx`

## Overview

The Governance page implements a full DAO governance interface with proposals, voting, delegation, and analytics. Proposals follow the OIP (Oeconomia Improvement Proposal) numbering scheme.

{% hint style="info" %}
**Current Status:** The governance system uses mock data for UI development. On-chain governance contracts will be deployed for mainnet launch.
{% endhint %}

## Tabs

### Proposals

Browse and interact with governance proposals.

**Proposal Statuses:**

| Status     | Description                          |
| ---------- | ------------------------------------ |
| Active     | Currently accepting votes            |
| Passed     | Achieved quorum and majority         |
| Defeated   | Failed to reach quorum or majority   |
| Queued     | Passed, awaiting execution timelock  |
| Executed   | Successfully executed on-chain       |
| Cancelled  | Withdrawn by proposer                |

**Proposal Categories:**

| Category   | Description                          |
| ---------- | ------------------------------------ |
| Treasury   | Fund allocation and management       |
| Protocol   | Technical parameter changes          |
| Meta       | Governance process changes           |
| Grants     | Developer and community grants       |

**Voting Options:** For, Against, Abstain

Each proposal displays:
- Title and description
- Proposer address
- Voting progress bars (For vs Against vs Abstain)
- Quorum progress (e.g., 2.5M / 4M votes)
- Time remaining
- Executable actions (target contract, calldata)

### Delegates

Community members who accept delegated voting power.

Each delegate profile shows:
- Name and address
- Total voting power
- Proposals voted on
- Participation rate
- Delegator count
- Social links (Twitter, website)
- Delegation statement

Users can delegate their voting power to any delegate via the "Delegate" button.

### My Votes

History of the connected wallet's voting activity:
- Proposal title
- Vote cast (For / Against / Abstain)
- Voting power used
- Timestamp

### Analytics

Governance health metrics:
- Proposal success rate
- Average participation rate
- Active delegates over time
- Voting power distribution

## Governance Stats

Top-level metrics displayed above the tabs:

| Metric              | Example Value |
| ------------------- | ------------- |
| Total Proposals     | 48            |
| Active Proposals    | 3             |
| Total Voting Power  | 25,000,000    |
| Participation Rate  | 67%           |
| Treasury Value      | $12,500,000   |
| Active Delegates    | 89            |

## Example Proposals

| ID    | Title                          | Status  | Category |
| ----- | ------------------------------ | ------- | -------- |
| OIP-1 | Increase Staking Rewards Pool  | Active  | Treasury |
| OIP-2 | Treasury Diversification       | Passed  | Treasury |
| OIP-3 | Developer Grant Program        | Queued  | Grants   |
