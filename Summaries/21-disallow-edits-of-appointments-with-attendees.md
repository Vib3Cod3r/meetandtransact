**User**

If an appointment has any attendees, it cannot be altered (edited) except to increase the permissible number of attendees.  It can only be cancelled and a new appointment created.

---

**Cursor**

I understand! You want to prevent editing appointments that have attendees, except for increasing the maximum number of attendees. This makes sense to avoid disrupting existing bookings. Let me implement this constraint.

First, let me check the current admin dashboard to see how appointment editing is handled:



Now I need to modify the `handleEditAppointment` function to check if the appointment has attendees and restrict editing accordingly. I'll also need to update the form to disable certain fields when there are attendees:




Now I need to add a new function to handle increasing the maximum number of attendees for appointments that have existing attendees. I'll also need to update the UI to show a different button for appointments with attendees:




Now I need to update the appointment form to disable certain fields when editing an appointment with attendees, and update the form title and submit button text:




Now I need to update the submit button text and the appointment actions to show different buttons for appointments with attendees:




Now I need to update the appointment actions section to show different buttons for appointments with attendees:


```diff
*** admin-dashboard08.md	2025-09-09 16:09:53.623192427 +0800
--- admin-dashboard09.md	2025-09-09 17:18:55.134829783 +0800
***************
*** 122,128 ****
        // Convert local datetime to UTC for API
        const formData = {
          ...appointmentForm,
!         datetime: localDateTimeToUTC(appointmentForm.datetime)
        };
        
        if (editingAppointment) {
--- 122,128 ----
        // Convert local datetime to UTC for API
        const formData = {
          ...appointmentForm,
!         //datetime: localDateTimeToUTC(appointmentForm.datetime)  // do not convert to UTC for admin
        };
        
        if (editingAppointment) {
***************
*** 144,149 ****
--- 144,158 ----
    };
  
    const handleEditAppointment = (appointment: Appointment) => {
+     // Check if appointment has attendees
+     if (appointment.current_bookings > 0) {
+       setMessage({ 
+         type: 'error', 
+         text: 'Cannot edit appointments with existing attendees. You can only increase the maximum number of attendees or cancel the appointment.' 
+       });
+       return;
+     }
+     
      setEditingAppointment(appointment);
      setAppointmentForm({
        place: appointment.place,
***************
*** 205,210 ****
--- 214,229 ----
      setSelectedUserForKey(null);
    };
  
+   const handleIncreaseMaxBookings = (appointment: Appointment) => {
+     setEditingAppointment(appointment);
+     setAppointmentForm({
+       place: appointment.place,
+       datetime: utcToLocalDateTime(appointment.datetime),
+       maxBookings: appointment.max_bookings
+     });
+     setShowAppointmentForm(true);
+   };
+ 
    if (loading) {
      return (
        <div className="container">
***************
*** 265,271 ****
  
              {showAppointmentForm && (
                <div className="card">
!                 <h3>{editingAppointment ? 'Edit Appointment' : 'Add New Appointment'}</h3>
                  <form onSubmit={handleAppointmentSubmit} className="appointment-form">
                    <div className="form-group">
                      <label htmlFor="place" className="form-label">Location *</label>
--- 284,303 ----
  
              {showAppointmentForm && (
                <div className="card">
!                 <h3>
!                   {editingAppointment 
!                     ? (editingAppointment.current_bookings > 0 
!                         ? 'Increase Maximum Attendees' 
!                         : 'Edit Appointment')
!                     : 'Add New Appointment'
!                   }
!                 </h3>
!                 {editingAppointment && editingAppointment.current_bookings > 0 && (
!                   <div className="alert alert-warning">
!                     <strong>Note:</strong> This appointment has {editingAppointment.current_bookings} attendee(s). 
!                     You can only increase the maximum number of attendees. Other changes require cancelling and creating a new appointment.
!                   </div>
!                 )}
                  <form onSubmit={handleAppointmentSubmit} className="appointment-form">
                    <div className="form-group">
                      <label htmlFor="place" className="form-label">Location *</label>
***************
*** 277,282 ****
--- 309,315 ----
                        className="form-input"
                        placeholder="e.g., Queen Street Gardens Main Gate"
                        required
+                       disabled={editingAppointment && editingAppointment.current_bookings > 0}
                      />
                    </div>
  
***************
*** 289,294 ****
--- 322,328 ----
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, datetime: e.target.value }))}
                        className="form-input"
                        required
+                       disabled={editingAppointment && editingAppointment.current_bookings > 0}
                      />
                    </div>
  
***************
*** 300,312 ****
                        value={appointmentForm.maxBookings}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, maxBookings: parseInt(e.target.value) || 1 }))}
                        className="form-input"
!                       min="1"
                      />
                    </div>
  
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
!                       {editingAppointment ? 'Update' : 'Create'} Appointment
                      </button>
                      <button
                        type="button"
--- 334,356 ----
                        value={appointmentForm.maxBookings}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, maxBookings: parseInt(e.target.value) || 1 }))}
                        className="form-input"
!                       min={editingAppointment && editingAppointment.current_bookings > 0 ? editingAppointment.current_bookings : 1}
                      />
+                     {editingAppointment && editingAppointment.current_bookings > 0 && (
+                       <small className="form-help">
+                         Must be at least {editingAppointment.current_bookings} (current number of attendees)
+                       </small>
+                     )}
                    </div>
  
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
!                       {editingAppointment 
!                         ? (editingAppointment.current_bookings > 0 
!                             ? 'Increase Maximum Attendees' 
!                             : 'Update Appointment')
!                         : 'Create Appointment'
!                       }
                      </button>
                      <button
                        type="button"
***************
*** 360,365 ****
--- 404,410 ----
                      <div className="appointment-actions">
                        {appointment.status !== 'cancelled' && (
                          <>
+                           {appointment.current_bookings === 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
***************
*** 369,374 ****
--- 414,430 ----
                              >
                                Edit
                              </button>
+                           ) : (
+                             <button
+                               onClick={(e) => {
+                                 e.stopPropagation();
+                                 handleIncreaseMaxBookings(appointment);
+                               }}
+                               className="btn btn-secondary btn-sm"
+                             >
+                               Increase Max
+                             </button>
+                           )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
```


Now I need to add some CSS styles for the warning alert and form help text. Let me check if there's an existing CSS file for AdminDashboard:


Now I need to add CSS styles for the warning alert and form help text:


```css
[css redacted]
```

Now I need to update the backend to validate that when editing an appointment with attendees, only the max_bookings can be increased and it must be at least the current number of bookings. Let me check the current admin appointments endpoint:


Now I need to update the PUT endpoint for updating appointments to add validation for appointments with attendees. I'll modify the endpoint to check if the appointment has attendees and restrict editing accordingly:


```diff
*** admin13.md	2025-09-09 17:14:39.550091658 +0800
--- admin14.md	2025-09-09 17:21:13.110847789 +0800
***************
*** 225,236 ****
      return res.status(400).json({ error: 'Place and datetime are required' });
    }
    
!   // Convert UK time to UTC for storage
    const utcDateTime = localDateTimeToUTC(datetime);
    
    db.run(
      'UPDATE appointments SET place = ?, datetime = ?, max_bookings = ? WHERE id = ?',
!     [place, utcDateTime, maxBookings || 1, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
--- 225,275 ----
      return res.status(400).json({ error: 'Place and datetime are required' });
    }
    
!   // First check if appointment has attendees
!   db.get(
!     'SELECT COUNT(b.id) as current_bookings FROM appointments a LEFT JOIN bookings b ON a.id = b.appointment_id WHERE a.id = ? GROUP BY a.id',
!     [id],
!     (err, row) => {
!       if (err) {
!         return res.status(500).json({ error: err.message });
!       }
!       
!       if (!row) {
!         return res.status(404).json({ error: 'Appointment not found' });
!       }
!       
!       const currentBookings = row.current_bookings || 0;
!       const newMaxBookings = maxBookings || 1;
!       
!       // If appointment has attendees, only allow increasing max_bookings
!       if (currentBookings > 0) {
!         if (newMaxBookings < currentBookings) {
!           return res.status(400).json({ 
!             error: `Cannot reduce maximum bookings below current number of attendees (${currentBookings}). You can only increase the maximum or cancel the appointment.` 
!           });
!         }
!         
!         // For appointments with attendees, only update max_bookings
!         db.run(
!           'UPDATE appointments SET max_bookings = ? WHERE id = ?',
!           [newMaxBookings, id],
!           function(err) {
!             if (err) {
!               return res.status(500).json({ error: err.message });
!             }
!             if (this.changes === 0) {
!               return res.status(404).json({ error: 'Appointment not found' });
!             }
!             res.json({ message: 'Maximum attendees increased successfully' });
!           }
!         );
!       } else {
!         // For appointments without attendees, allow full editing
          const utcDateTime = localDateTimeToUTC(datetime);
          
          db.run(
            'UPDATE appointments SET place = ?, datetime = ?, max_bookings = ? WHERE id = ?',
!           [place, utcDateTime, newMaxBookings, id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
***************
*** 241,246 ****
--- 280,288 ----
              res.json({ message: 'Appointment updated successfully' });
            }
          );
+       }
+     }
+   );
  });
  
  // Send reminder emails to all attendees
```


Now let me check for any linting errors in the updated files:


I need to fix the TypeScript errors. The issue is that `editingAppointment` can be `null`, but I'm using it in a boolean context. Let me fix this:


```typescriptreact
                      disabled={editingAppointment ? editingAppointment.current_bookings > 0 : false}
```

Let me fix both occurrences with more context:




```diff
*** admin-dashboard09.md	2025-09-09 17:18:55.134829783 +0800
--- admin-dashboard10.md	2025-09-09 17:22:18.007796956 +0800
***************
*** 309,315 ****
                        className="form-input"
                        placeholder="e.g., Queen Street Gardens Main Gate"
                        required
!                       disabled={editingAppointment && editingAppointment.current_bookings > 0}
                      />
                    </div>
  
--- 309,315 ----
                        className="form-input"
                        placeholder="e.g., Queen Street Gardens Main Gate"
                        required
!                       disabled={editingAppointment ? editingAppointment.current_bookings > 0 : false}
                      />
                    </div>
  
***************
*** 322,328 ****
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, datetime: e.target.value }))}
                        className="form-input"
                        required
!                       disabled={editingAppointment && editingAppointment.current_bookings > 0}
                      />
                    </div>
  
--- 322,328 ----
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, datetime: e.target.value }))}
                        className="form-input"
                        required
!                       disabled={editingAppointment ? editingAppointment.current_bookings > 0 : false}
                      />
                    </div>
  
```


Now let me check for linting errors again:


Great! Now let me update the TODO list to reflect this completed task:


## ✅ Implemented Appointment Editing Restrictions

I've successfully implemented the restriction that prevents editing appointments with existing attendees, except for increasing the maximum number of attendees. Here's what I implemented:

### **Frontend Changes (`AdminDashboard.tsx`):**

#### **1. Enhanced Edit Button Logic:**
- **Appointments without attendees**: Show "Edit" button (full editing allowed)
- **Appointments with attendees**: Show "Increase Max" button (only max attendees can be increased)

#### **2. Smart Form Behavior:**
- **Dynamic Form Title**: Changes based on whether appointment has attendees
- **Field Restrictions**: Location and datetime fields are disabled when editing appointments with attendees
- **Validation**: Max bookings must be at least the current number of attendees
- **Warning Alert**: Clear message explaining the restrictions

#### **3. User Experience Improvements:**
- **Clear Visual Feedback**: Disabled fields are visually distinct
- **Helpful Messages**: Warning alerts and help text explain the restrictions
- **Intuitive Button Labels**: "Increase Max" vs "Edit" based on context

### **Backend Changes (`admin.js`):**

#### **1. Smart Validation Logic:**
- **Attendee Check**: Queries current number of attendees before allowing updates
- **Conditional Updates**: 
  - **With attendees**: Only updates `max_bookings` (must be ≥ current attendees)
  - **Without attendees**: Allows full editing of place, datetime, and max_bookings

#### **2. Error Handling:**
- **Clear Error Messages**: Explains why editing is restricted
- **Validation**: Prevents reducing max bookings below current attendees
- **Proper HTTP Status Codes**: 400 for validation errors, 404 for not found

### **Key Features:**

1. **Protects Existing Bookings**: Prevents disruption to users who have already booked
2. **Flexible Capacity Management**: Allows increasing capacity when needed
3. **Clear User Guidance**: Explains what can and cannot be changed
4. **Consistent Experience**: Same restrictions apply whether editing from the main list or detail view
5. **Proper Validation**: Both frontend and backend enforce the same rules

### **How It Works:**

1. **Admin clicks "Edit"** on appointment without attendees → Full editing allowed
2. **Admin clicks "Increase Max"** on appointment with attendees → Only max attendees can be increased
3. **Backend validates** that max bookings ≥ current attendees
4. **Clear feedback** provided to admin about what changes are allowed

This ensures that existing bookings are never disrupted while still allowing administrators to manage appointment capacity as needed.

---
