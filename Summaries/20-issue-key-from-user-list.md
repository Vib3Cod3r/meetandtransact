**User**

It should be possible to see appointment history and to issue a key from the user records in the attendee list for an appointment.

---

**Cursor**

I understand! You want to be able to view appointment history and issue keys directly from the attendee list when viewing an appointment detail page. Currently, these features are only available from the main users tab. Let me add these capabilities to the appointment detail view.

First, let me check the current appointment detail component:


Now I need to update the `AppointmentDetail` component to include the key management functionality and appointment history. I'll need to:

1. Add the `KeyManagementModal` import and state
2. Add user history functionality
3. Update the `Attendee` interface to include key information
4. Add action buttons for each attendee
5. Import the necessary components

Let me update the component:






Now I need to add the appointment history interface and update the component state:




Now I need to add the state variables for key management and user history:




Now I need to add the functions for handling key management and user history:




Now I need to update the attendees section to show the user history view and add action buttons. Let me replace the attendees section:




Now I need to add the KeyManagementModal at the end of the component:


```diff
*** appointment-detail02.md	2025-09-09 14:03:45.285400942 +0800
--- appointment-detail03.md	2025-09-09 17:12:50.784500877 +0800
***************
*** 3,8 ****
--- 3,9 ----
  import { useParams, useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import { formatDateTimeForUK, formatDateTimeShort } from '../utils/timezone';
+ import KeyManagementModal from './KeyManagementModal';
  import './AppointmentDetail.css';
  
  interface Attendee {
***************
*** 11,16 ****
--- 12,18 ----
    email: string;
    home_address: string;
    phone_number?: string;
+   key_serial_number?: string;
    booking_date: string;
  }
  
***************
*** 25,30 ****
--- 27,45 ----
    attendees: Attendee[];
  }
  
+ interface AppointmentHistory {
+   id: number;
+   user_id: number;
+   appointment_id: number;
+   action: string;
+   action_timestamp: string;
+   details: string;
+   place: string;
+   datetime: string;
+   user_name: string;
+   email: string;
+ }
+ 
  const AppointmentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
***************
*** 32,37 ****
--- 47,56 ----
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
+   const [showKeyManagement, setShowKeyManagement] = useState(false);
+   const [selectedUserForKey, setSelectedUserForKey] = useState<Attendee | null>(null);
+   const [userHistory, setUserHistory] = useState<AppointmentHistory[]>([]);
+   const [selectedUserForHistory, setSelectedUserForHistory] = useState<Attendee | null>(null);
  
    useEffect(() => {
      fetchAppointmentDetails();
***************
*** 111,116 ****
--- 130,179 ----
      return formatDateTimeShort(bookingDate);
    };
  
+   const fetchUserHistory = async (userId: number) => {
+     try {
+       const token = localStorage.getItem('adminToken');
+       const response = await axios.get(`/api/admin/users/${userId}/history`, {
+         headers: { Authorization: `Bearer ${token}` }
+       });
+       setUserHistory(response.data);
+     } catch (error) {
+       setMessage({ type: 'error', text: 'Failed to load user history.' });
+     }
+   };
+ 
+   const handleViewUserHistory = (attendee: Attendee) => {
+     setSelectedUserForHistory(attendee);
+     fetchUserHistory(attendee.user_id);
+   };
+ 
+   const handleBackToAttendees = () => {
+     setSelectedUserForHistory(null);
+     setUserHistory([]);
+   };
+ 
+   const handleManageKey = (attendee: Attendee) => {
+     setSelectedUserForKey(attendee);
+     setShowKeyManagement(true);
+   };
+ 
+   const handleKeyIssued = (keySerialNumber: string) => {
+     setMessage({ type: 'success', text: `Key issued successfully with serial number: ${keySerialNumber}` });
+     // Refresh appointment details to show updated key status
+     fetchAppointmentDetails();
+   };
+ 
+   const handleKeyRevoked = () => {
+     setMessage({ type: 'success', text: 'Key revoked successfully' });
+     // Refresh appointment details to show updated key status
+     fetchAppointmentDetails();
+   };
+ 
+   const handleCloseKeyManagement = () => {
+     setShowKeyManagement(false);
+     setSelectedUserForKey(null);
+   };
+ 
    if (loading) {
      return (
        <div className="container">
***************
*** 195,200 ****
--- 258,265 ----
          </div>
  
          <div className="attendees-section">
+           {!selectedUserForHistory ? (
+             <>
                <h3>Attendees ({appointment.attendees.length})</h3>
                
                {appointment.attendees.length === 0 ? (
***************
*** 212,226 ****
--- 277,367 ----
                          {attendee.phone_number && (
                            <p className="attendee-phone">Phone: {attendee.phone_number}</p>
                          )}
+                         <p className="attendee-key-status">
+                           <strong>Key Status:</strong> 
+                           <span className={`key-status ${attendee.key_serial_number ? 'has-key' : 'no-key'}`}>
+                             {attendee.key_serial_number ? `Serial: ${attendee.key_serial_number}` : 'No key issued'}
+                           </span>
+                         </p>
                          <p className="attendee-booking-date">
                            Booked: {formatBookingDate(attendee.booking_date)}
                          </p>
                        </div>
+                       <div className="attendee-actions">
+                         <button
+                           onClick={() => handleViewUserHistory(attendee)}
+                           className="btn btn-primary btn-sm"
+                         >
+                           View History
+                         </button>
+                         <button
+                           onClick={() => handleManageKey(attendee)}
+                           className="btn btn-secondary btn-sm"
+                         >
+                           {attendee.key_serial_number ? 'Manage Key' : 'Issue Key'}
+                         </button>
+                       </div>
+                     </div>
+                   ))}
+                 </div>
+               )}
+             </>
+           ) : (
+             <>
+               <div className="section-header">
+                 <button
+                   onClick={handleBackToAttendees}
+                   className="btn btn-secondary"
+                   style={{ marginRight: '1rem' }}
+                 >
+                   ← Back to Attendees
+                 </button>
+                 <h3>Appointment History - {selectedUserForHistory.name}</h3>
+               </div>
+ 
+               <div className="user-history">
+                 {userHistory.length === 0 ? (
+                   <div className="card text-center">
+                     <p>No appointment history found for this user.</p>
+                   </div>
+                 ) : (
+                   <div className="history-list">
+                     {userHistory.map((history) => (
+                       <div key={history.id} className="history-card">
+                         <div className="history-header">
+                           <h4 className={`history-action ${history.action}`}>
+                             {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
+                           </h4>
+                           <span className="history-timestamp">
+                             {formatDateTime(history.action_timestamp)}
+                           </span>
+                         </div>
+                         <div className="history-details">
+                           <p><strong>Appointment:</strong> {history.place}</p>
+                           <p><strong>Date & Time:</strong> {formatDateTime(history.datetime)}</p>
+                           {history.details && (
+                             <p><strong>Details:</strong> {history.details}</p>
+                           )}
+                         </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
+             </>
+           )}
+         </div>
+ 
+         {/* Key Management Modal */}
+         {selectedUserForKey && (
+           <KeyManagementModal
+             isOpen={showKeyManagement}
+             user={selectedUserForKey}
+             onClose={handleCloseKeyManagement}
+             onKeyIssued={handleKeyIssued}
+             onKeyRevoked={handleKeyRevoked}
+           />
+         )}
        </div>
      </div>
    );
```


Now I need to update the backend to include the key_serial_number in the attendee data when fetching appointment details. Let me check the current admin appointments endpoint:


I can see that the appointment details endpoint (lines 135-183) doesn't include the `key_serial_number` field. I need to update it to include this field:




```diff
*** admin12.md	2025-09-09 16:06:38.192804915 +0800
--- admin13.md	2025-09-09 17:14:39.550091658 +0800
***************
*** 143,148 ****
--- 143,149 ----
             u.email,
             u.home_address,
             u.phone_number,
+            u.key_serial_number,
             b.booking_date
      FROM appointments a
      LEFT JOIN bookings b ON a.id = b.appointment_id
***************
*** 175,180 ****
--- 176,182 ----
          email: row.email,
          home_address: row.home_address,
          phone_number: row.phone_number,
+         key_serial_number: row.key_serial_number,
          booking_date: fromUTC(row.booking_date)
        }))
      };
```


Now I need to add some CSS styles for the new elements. Let me check if there's an existing CSS file for AppointmentDetail:


Now I need to add CSS styles for the new elements. Let me add them to the existing CSS file:


```css
[css redacted]
```

Now let me check for any linting errors in the updated files:


Now let me update the TODO list to reflect this completed task:


## ✅ Added Appointment History and Key Management to Appointment Detail Page

I've successfully added the ability to view appointment history and issue/manage keys directly from the attendee list in the appointment detail page. Here's what I implemented:

### **New Features Added:**

#### **1. Enhanced Attendee Cards:**
- **Key Status Display**: Each attendee now shows their key status (issued with serial number or "No key issued")
- **Action Buttons**: Two buttons for each attendee:
  - **"View History"** - Shows the user's complete appointment history
  - **"Issue Key"** or **"Manage Key"** - Opens the key management modal

#### **2. Appointment History View:**
- **Dedicated History Page**: Clicking "View History" shows a dedicated view for that user's appointment history
- **Complete History**: Shows all appointment actions (created, cancelled, rescheduled, key issued/revoked)
- **Detailed Information**: Each history entry shows:
  - Action type with color-coded badges
  - Timestamp
  - Appointment details (place, date/time)
  - Additional details when available
- **Navigation**: Easy "Back to Attendees" button to return to the main view

#### **3. Key Management Integration:**
- **Modal Integration**: Uses the existing `KeyManagementModal` component
- **Real-time Updates**: After issuing or revoking a key, the attendee list refreshes to show updated status
- **Success Feedback**: Shows confirmation messages when keys are issued or revoked

#### **4. Backend Updates:**
- **Enhanced API**: Updated the appointment details endpoint to include `key_serial_number` for each attendee
- **Complete Data**: The API now returns all necessary user information for key management

#### **5. Styling:**
- **Visual Indicators**: Color-coded key status badges (green for issued, yellow for not issued)
- **Action Buttons**: Small, well-organized buttons for each attendee
- **History Cards**: Clean, organized display of appointment history
- **Responsive Design**: Works well on different screen sizes

### **How It Works:**

1. **Viewing Attendees**: When you open an appointment detail page, you'll see all attendees with their key status and action buttons
2. **Viewing History**: Click "View History" to see a user's complete appointment history in a dedicated view
3. **Managing Keys**: Click "Issue Key" or "Manage Key" to open the key management modal
4. **Real-time Updates**: After any key management action, the page refreshes to show the updated status

### **Benefits:**
- **Centralized Management**: Admins can manage everything from the appointment detail page
- **Complete Context**: See user history and key status in the context of the specific appointment
- **Efficient Workflow**: No need to navigate between different admin pages
- **Real-time Information**: Always see the most current key status and user information

The appointment detail page is now a comprehensive management interface where admins can view attendee information, check appointment history, and manage keys all in one place!

---
