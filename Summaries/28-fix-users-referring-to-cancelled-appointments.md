**User**

When an appointment is cancelled, the cancelled attendees still refer to it in their user cars in the admin users view.  Instead it should be made clear that they currently have no active appointment until they choose another one.

---

**Cursor**

I understand the issue! When an appointment is cancelled, the user cards in the admin users view still show the cancelled appointment details, which is confusing. Users should see that they have no active appointment until they reschedule. Let me fix this by updating the users query to only show active appointments.

First, let me check the current users query in the admin routes:


I found the issue! The users query on lines 460-469 is joining with all appointments (including cancelled ones) without filtering by status. Let me fix this by updating the query to only show active appointments:


```diff
*** admin17.md	2025-09-09 18:18:06.760402525 +0800
--- admin18.md	2025-09-09 18:20:28.813473211 +0800
***************
*** 460,467 ****
  router.get('/users', verifyAdmin, (req, res) => {
    const query = `
      SELECT u.*, 
!            COUNT(b.id) as total_bookings,
!            GROUP_CONCAT(a.place || ' (' || a.datetime || ')', ', ') as appointments
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN appointments a ON b.appointment_id = a.id
--- 460,467 ----
  router.get('/users', verifyAdmin, (req, res) => {
    const query = `
      SELECT u.*, 
!            COUNT(CASE WHEN a.status = 'active' THEN b.id END) as total_bookings,
!            GROUP_CONCAT(CASE WHEN a.status = 'active' THEN a.place || ' (' || a.datetime || ')' END, ', ') as appointments
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN appointments a ON b.appointment_id = a.id
```


Now I need to update the frontend to handle the case where users have no active appointments. Let me check the AdminDashboard component to see how it displays user information:


I can see the issue! The user cards display appointment information on lines 489-493, but they don't handle the case where users have no active appointments. Let me update the display logic to show a clear message when users have no active appointments:


```diff
*** admin-dashboard10.md	2025-09-09 17:22:18.007796956 +0800
--- admin-dashboard11.md	2025-09-09 18:21:48.590714381 +0800
***************
*** 479,485 ****
                              <p className="user-phone">Phone: {user.phone_number}</p>
                            )}
                            <p className="user-bookings">
!                             Total bookings: {user.total_bookings}
                            </p>
                            <p className="user-key-status">
                              <strong>Key Status:</strong> 
--- 479,485 ----
                              <p className="user-phone">Phone: {user.phone_number}</p>
                            )}
                            <p className="user-bookings">
!                             Active bookings: {user.total_bookings}
                            </p>
                            <p className="user-key-status">
                              <strong>Key Status:</strong> 
***************
*** 487,495 ****
                                {user.key_serial_number ? `Serial: ${user.key_serial_number}` : 'No key issued'}
                              </span>
                            </p>
!                           {user.appointments && (
                              <p className="user-appointments">
!                               <strong>Appointments:</strong> {user.appointments}
                              </p>
                            )}
                          </div>
--- 487,499 ----
                                {user.key_serial_number ? `Serial: ${user.key_serial_number}` : 'No key issued'}
                              </span>
                            </p>
!                           {user.appointments ? (
                              <p className="user-appointments">
!                               <strong>Current Appointment:</strong> {user.appointments}
!                             </p>
!                           ) : (
!                             <p className="user-no-appointments">
!                               <strong>Status:</strong> <span className="no-appointment">No active appointment</span>
                              </p>
                            )}
                          </div>
```


Now let me add some CSS styling for the "No active appointment" status to make it visually clear:


Now let me add CSS styling for the "No active appointment" status:


```css
[redacted]
```

Now let me check for any linting errors:


Perfect! Now let me update the TODO list to track this completed fix:


## ✅ Fixed Cancelled Appointment Display in User Cards

I've successfully resolved the issue where cancelled attendees still showed their cancelled appointment details in the admin users view! Here's what I implemented:

### **Problem Solved:**
- **Before**: User cards showed cancelled appointment details, making it confusing for admins
- **After**: User cards clearly show "No active appointment" status for users whose appointments were cancelled

### **Changes Made:**

#### **1. Backend Query Fix (`server/routes/admin.js`):**
- **Updated users query**: Added `CASE WHEN a.status = 'active'` conditions to only count and display active appointments
- **Before**: `COUNT(b.id) as total_bookings` and `GROUP_CONCAT(a.place || ' (' || a.datetime || ')', ', ') as appointments`
- **After**: `COUNT(CASE WHEN a.status = 'active' THEN b.id END) as total_bookings` and `GROUP_CONCAT(CASE WHEN a.status = 'active' THEN a.place || ' (' || a.datetime || ')' END, ', ') as appointments`

#### **2. Frontend Display Logic (`AdminDashboard.tsx`):**
- **Updated user card display**: Added conditional rendering to show different messages based on appointment status
- **Active appointments**: Shows "Current Appointment: [details]"
- **No active appointments**: Shows "Status: No active appointment" in red italic text
- **Changed label**: "Total bookings" → "Active bookings" for clarity

#### **3. Visual Styling (`AdminDashboard.css`):**
- **Added styling for no-appointment status**: Red, italic text to make it visually clear
- **Consistent styling**: Matches the existing design language while being distinct

### **User Experience Improvements:**

#### **For Users with Active Appointments:**
- **Shows**: "Current Appointment: Queen Street Gardens - Main Gate (Monday, 8 September 2025 at 13:00)"
- **Shows**: "Active bookings: 1"

#### **For Users with Cancelled Appointments:**
- **Shows**: "Status: *No active appointment*" (in red italic)
- **Shows**: "Active bookings: 0"

### **Benefits:**
1. **Clear Status Indication**: Admins can immediately see which users need to reschedule
2. **Accurate Information**: Only shows current, active appointments
3. **Visual Distinction**: Red italic text makes the "no appointment" status stand out
4. **Consistent Data**: Backend and frontend now both filter for active appointments only

Now when an appointment is cancelled, the affected users will clearly show that they have no active appointment until they choose to reschedule!

