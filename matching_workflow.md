# MentorLink — Matching & Triage Workflow

## Purpose
Provide a simple, actionable triage and matching workflow to reduce pending requests, balance mentor workload, and improve response time.

## Goals
- Resolve new requests within 48–72 hours.
- Reduce pending requests to near-zero within 1 month.
- Distribute workload so no mentor exceeds a defined load threshold.

## Roles
- Triage Operator: staff or system component that classifies requests and escalates urgent ones.
- Mentor Router: automated matching service (or manual operator) that assigns requests to mentors.

## SLA Targets
- Acknowledge new request: within 24 hours.
- Assign to mentor (or schedule group session): within 48–72 hours.

## Workflow Steps
1. Request Intake
   - Capture: user_id, topic/tags, requested times, urgency (low/medium/high), preferred mentor (optional).
   - Assign unique request_id and timestamp.

2. Automated Triage (0–1 hour)
   - Validate fields (required: topic, contact method).
   - Classify urgency using rules (example: deadline within 48 hrs → high).
   - If missing data, send automated clarification request to user and set status `awaiting_info`.

3. Match Attempt (0–6 hours)
   - Query mentor pool for available mentors matching: topic skills, time availability overlap, and current load < threshold.
   - Prefer mentors with recent positive feedback and matching timezone if applicable.
   - If multiple matches, use round-robin or least-load-first.

4. Assignment
   - If a mentor is available, create tentative assignment and notify mentor.
   - If mentor accepts (or system auto-assigns), set status `assigned` and notify mentee with scheduled time.

5. Escalation / Group Option
   - If no mentor accepts within 24 hours or none match, consider:
     - Scheduling a group session (1 mentor + multiple mentees) for common topics.
     - Escalating to Triage Operator for manual routing or external mentor invite.

6. Monitoring & Rebalance
   - If any mentor's assigned load exceeds `MAX_ACTIVE_REQUESTS` (e.g., 8 concurrent active assignments), mark them as `restricted` for auto-assign and notify operations.
   - Periodically (daily) rebalance by offering open requests to underused mentors with an incentive.

## Matching Rules (Pseudo)

- Input: request R(topic, times, urgency), mentor list M[] (skills, availability, current_load)
- Filter M by skill match and time overlap
- Filter out mentors where current_load >= MAX_ACTIVE_REQUESTS
- Sort filtered M by (current_load asc, last_assigned_time asc)
- If filtered M non-empty:
  - assign to first mentor
  - notify mentor
- Else:
  - if urgency == high → escalate to operator immediately
  - else → queue for auto-offer to underused mentors and consider group session

## Incentives & Nudges
- Offer recognition (badges) and small credits/vouchers for mentors who pick up extra requests.
- Send weekly digest to underused mentors listing open/available requests in their skill areas.

## KPIs to Track
- Pending requests (count)
- Average time to assign (hours)
- Time to first contact (hours)
- Sessions per mentor (weekly)
- Top-mentor load and % of sessions by top 5 mentors

## Implementation Notes
- Start with a simple auto-assign algorithm and expand rules as data shows patterns.
- Log all decisions to allow auditing and improvement of matching rules.
- If you have availability data for mentors, use it to compute match confidence score.

## Quick Pilot Plan (2 weeks)
1. Implement triage + auto-assign rules as described.
2. Run a 2-week pilot with small incentives for underused mentors.
3. Track KPIs daily and adjust `MAX_ACTIVE_REQUESTS` and SLA thresholds.
4. After pilot, refine routing rules and consider adding group sessions for frequent topics.

---

If you want, I can also produce a compact JSON schema for request and mentor objects and a small Node.js snippet that implements the pseudo matching logic.
