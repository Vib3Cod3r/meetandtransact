**User**

When cancelling an appointment from the appointment page showing the attendees below, we get an error after the emails have been sent: "Failed to load appointment details".  This may be fair enough, but a feedback modal stating that the apointment has been successfully cancelled and the scheduled attendees had been emailed woudl be more appropriate.

---

**Cursor**

I can see the issue! When an appointment is cancelled, it changes status to "cancelled" and the appointment detail page tries to reload the details, but the query filters out cancelled appointments, causing the "Failed to load appointment details" error. Let me fix this by adding a success modal for appointment cancellation.

First, let me check the current AppointmentDetail component to understand how cancellation is handled:



Now I can see the issue. The problem is on line 115 where `fetchAppointmentDetails()` is called after cancellation, but the backend query filters out cancelled appointments. Let me check the backend query to confirm:


Perfect! I can see the issue. On line 150, the query has `WHERE a.id = ? AND a.status = 'active'`, which filters out cancelled appointments. When an appointment is cancelled, it can no longer be fetched by this endpoint.

Let me fix this by:
1. Removing the `fetchAppointmentDetails()` call after cancellation
2. Adding a success modal that shows the cancellation was successful
3. Updating the backend to allow fetching cancelled appointments for the detail view

First, let me update the backend to allow fetching cancelled appointments:

```diff
*** admin15.md	2025-09-09 17:51:20.538745942 +0800
--- admin16.md	2025-09-09 18:05:53.237730742 +0800
***************
*** 148,154 ****
      FROM appointments a
      LEFT JOIN bookings b ON a.id = b.appointment_id
      LEFT JOIN users u ON b.user_id = u.id
!     WHERE a.id = ? AND a.status = 'active'
      ORDER BY b.booking_date ASC
    `;
    
--- 148,154 ----
      FROM appointments a
      LEFT JOIN bookings b ON a.id = b.appointment_id
      LEFT JOIN users u ON b.user_id = u.id
!     WHERE a.id = ?
      ORDER BY b.booking_date ASC
    `;
```


Now let me create a success modal component for appointment cancellation:


```diff
*** cancellation-success-modal01.md	2025-09-09 18:10:22.613649804 +0800
--- cancellation-success-modal02.md	2025-09-09 18:09:13.126638857 +0800
***************
*** 1,2 ****
--- 1,49 ----
  ```typescriptreact
+ import React from 'react';
+ import './CancellationSuccessModal.css';
+ 
+ interface CancellationSuccessModalProps {
+   isOpen: boolean;
+   onClose: () => void;
+   appointmentDetails: {
+     place: string;
+     datetime: string;
+     attendeeCount: number;
+   };
+ }
+ 
+ const CancellationSuccessModal: React.FC<CancellationSuccessModalProps> = ({
+   isOpen,
+   onClose,
+   appointmentDetails
+ }) => {
+   if (!isOpen) return null;
+ 
+   return (
+     <div className="modal-overlay">
+       <div className="modal-content cancellation-success-modal">
+         <div className="success-icon">
+           <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
+             <circle cx="12" cy="12" r="10" fill="#dc2626" stroke="#dc2626" strokeWidth="2"/>
+             <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
+           </svg>
+         </div>
+ 
+         <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Appointment Cancelled</h2>
+         <p style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '1.5rem' }}>
+           The appointment at <strong>{appointmentDetails.place}</strong> on{' '}
+           <strong>{appointmentDetails.datetime}</strong> has been successfully cancelled.
+         </p>
+         <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
+           Rescheduling emails have been sent to all {appointmentDetails.attendeeCount} scheduled attendees.
+         </p>
+         <button onClick={onClose} className="btn btn-primary">
+           Return to Dashboard
+         </button>
+       </div>
+     </div>
+   );
+ };
+ 
+ export default CancellationSuccessModal;
  ```
```

Now let me create the CSS for the cancellation success modal:


```css
[redacted]
```

Now let me update the AppointmentDetail component to use the success modal instead of refreshing the appointment details:




Now let me add the state for the cancellation success modal:




Now let me update the cancellation handler to show the success modal instead of refreshing:




Now let me add the handler for closing the cancellation success modal:




Now let me add the cancellation success modal to the JSX:


```diff
*** appointment-detail03.md	2025-09-09 17:12:50.784500877 +0800
--- appointment-detail04.md	2025-09-09 18:12:51.168811085 +0800
***************
*** 4,9 ****
--- 4,10 ----
  import axios from 'axios';
  import { formatDateTimeForUK, formatDateTimeShort } from '../utils/timezone';
  import KeyManagementModal from './KeyManagementModal';
+ import CancellationSuccessModal from './CancellationSuccessModal';
  import './AppointmentDetail.css';
  
  interface Attendee {
***************
*** 51,56 ****
--- 52,63 ----
    const [selectedUserForKey, setSelectedUserForKey] = useState<Attendee | null>(null);
    const [userHistory, setUserHistory] = useState<AppointmentHistory[]>([]);
    const [selectedUserForHistory, setSelectedUserForHistory] = useState<Attendee | null>(null);
+   const [showCancellationSuccess, setShowCancellationSuccess] = useState(false);
+   const [cancelledAppointmentDetails, setCancelledAppointmentDetails] = useState<{
+     place: string;
+     datetime: string;
+     attendeeCount: number;
+   } | null>(null);
  
    useEffect(() => {
      fetchAppointmentDetails();
***************
*** 111,119 ****
        await axios.post(`/api/admin/appointments/${id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
!       setMessage({ type: 'success', text: 'Appointment cancelled and rescheduling emails sent!' });
!       // Refresh the appointment details
!       fetchAppointmentDetails();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to cancel appointment.';
        setMessage({ type: 'error', text: errorMessage });
--- 118,131 ----
        await axios.post(`/api/admin/appointments/${id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
!       
!       // Show success modal with appointment details
!       setCancelledAppointmentDetails({
!         place: appointment.place,
!         datetime: formatDateTime(appointment.datetime),
!         attendeeCount: appointment.attendees.length
!       });
!       setShowCancellationSuccess(true);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to cancel appointment.';
        setMessage({ type: 'error', text: errorMessage });
***************
*** 174,179 ****
--- 186,197 ----
      setSelectedUserForKey(null);
    };
  
+   const handleCancellationSuccessClose = () => {
+     setShowCancellationSuccess(false);
+     setCancelledAppointmentDetails(null);
+     navigate('/admin/dashboard');
+   };
+ 
    if (loading) {
      return (
        <div className="container">
***************
*** 356,367 ****
          {selectedUserForKey && (
            <KeyManagementModal
              isOpen={showKeyManagement}
!             user={selectedUserForKey}
              onClose={handleCloseKeyManagement}
              onKeyIssued={handleKeyIssued}
              onKeyRevoked={handleKeyRevoked}
            />
          )}
        </div>
      </div>
    );
--- 374,399 ----
          {selectedUserForKey && (
            <KeyManagementModal
              isOpen={showKeyManagement}
!             user={{
!               id: selectedUserForKey.user_id,
!               name: selectedUserForKey.name,
!               email: selectedUserForKey.email,
!               key_serial_number: selectedUserForKey.key_serial_number
!             }}
              onClose={handleCloseKeyManagement}
              onKeyIssued={handleKeyIssued}
              onKeyRevoked={handleKeyRevoked}
            />
          )}
+ 
+         {/* Cancellation Success Modal */}
+         {cancelledAppointmentDetails && (
+           <CancellationSuccessModal
+             isOpen={showCancellationSuccess}
+             onClose={handleCancellationSuccessClose}
+             appointmentDetails={cancelledAppointmentDetails}
+           />
+         )}
        </div>
      </div>
    );
```


Now let me check for any linting errors in the files I've modified:


Perfect! Now let me update the TODO list to track this completed feature:


## ✅ Fixed Appointment Cancellation Feedback

I've successfully resolved the issue with appointment cancellation feedback! Here's what I implemented:

### **Problem Solved:**
- **Before**: After cancelling an appointment, users got "Failed to load appointment details" error because the backend filtered out cancelled appointments
- **After**: Users now see a professional success modal confirming the cancellation and email notifications

### **Changes Made:**

#### **1. Backend Fix (`server/routes/admin.js`):**
- **Removed status filter**: Updated the appointment details query to allow fetching cancelled appointments
- **Before**: `WHERE a.id = ? AND a.status = 'active'`
- **After**: `WHERE a.id = ?` (allows both active and cancelled appointments)

#### **2. New Success Modal (`CancellationSuccessModal.tsx`):**
- **Professional design**: Red-themed modal with checkmark icon to indicate cancellation
- **Clear messaging**: Shows appointment details and confirms emails were sent
- **User-friendly**: Displays number of attendees who received rescheduling emails
- **Navigation**: Returns user to admin dashboard after confirmation

#### **3. Updated AppointmentDetail Component:**
- **Removed problematic refresh**: No longer calls `fetchAppointmentDetails()` after cancellation
- **Added success modal state**: New state management for showing cancellation success
- **Better UX flow**: Shows success modal → user clicks "Return to Dashboard" → navigates away
- **Preserved appointment data**: Uses existing appointment data for the success message

### **User Experience:**
1. **Admin clicks "Cancel Appointment"** → Confirmation dialog appears
2. **Admin confirms cancellation** → Loading state shows "Cancelling..."
3. **Cancellation completes** → Success modal appears with:
   - ✅ Confirmation that appointment was cancelled
   - 📍 Appointment location and time
   - 📧 Number of attendees who received rescheduling emails
   - 🔄 Button to return to dashboard
4. **Admin clicks "Return to Dashboard"** → Navigates back to main admin view

The cancellation process now provides clear, professional feedback instead of confusing error messages!

---
