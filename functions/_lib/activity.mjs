// Single insert point for every trackable user action — signup, login,
// bio-page saves, subscription changes, public page views, etc. Routing
// all of them through one function keeps every row the same shape
// (event_type + a JSON details blob), which is what makes the admin feed
// and any future analytics query straightforward.
export async function logEvent(db, userId, eventType, details = null) {
  await db.sql`
    INSERT INTO activity_events (user_id, event_type, details)
    VALUES (${userId}, ${eventType}, ${details ? JSON.stringify(details) : null})
  `;
}
