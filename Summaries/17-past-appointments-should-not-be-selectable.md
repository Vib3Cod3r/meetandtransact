
**User**

ok past appointments should not be selectable to set as an appointment time in the booking form.

---

**Commentary**

Cursor decides to implement the filter on the frontend.  A reasonable choice, but note it needs to implement the same logic in two places - the booking form and the rescedule form.  This is a violation of DRY principles, but Cursor seems to have no problems working out that it needs to update both of them.  What would happen if it had to update 20 pages?


**Cursor**

I can see the issue! The booking form is currently showing all appointments regardless of whether they're in the past. Let me fix this by filtering out past appointments in the frontend.

Looking at the current code, I need to update the `BookingPage.tsx` component to filter out appointments that are in the past before displaying them to users.

Let me check the current implementation and fix it:



Now I need to add filtering logic to exclude past appointments. I'll modify the `fetchAppointments` function to filter out appointments that are in the past:


```diff
*** booking15.md	2025-09-09 16:14:49.687809351 +0800
--- booking16.md	2025-09-09 16:35:54.185833761 +0800
***************
*** 49,55 ****
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/appointments');
!       setAppointments(response.data);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load appointments. Please try again.' });
      } finally {
--- 49,63 ----
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/appointments');
!       const now = new Date();
!       
!       // Filter out past appointments
!       const futureAppointments = response.data.filter((appointment: Appointment) => {
!         const appointmentDate = new Date(appointment.datetime);
!         return appointmentDate > now;
!       });
!       
!       setAppointments(futureAppointments);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load appointments. Please try again.' });
      } finally {
```


Now I should also update the ReschedulePage component to filter out past appointments as well:


Now I'll update the ReschedulePage to also filter out past appointments:


```diff
*** reschedule08.md	2025-09-09 16:16:52.090304703 +0800
--- reschedule09.md	2025-09-09 16:37:09.345782888 +0800
***************
*** 85,91 ****
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/appointments');
!       setAppointments(response.data);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load appointments. Please try again.' });
      } finally {
--- 85,99 ----
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/appointments');
!       const now = new Date();
!       
!       // Filter out past appointments
!       const futureAppointments = response.data.filter((appointment: Appointment) => {
!         const appointmentDate = new Date(appointment.datetime);
!         return appointmentDate > now;
!       });
!       
!       setAppointments(futureAppointments);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load appointments. Please try again.' });
      } finally {
```


Now let me check for any linting errors in the files I've modified:


Perfect! Now let me update the TODO list to reflect this completed task:


## ✅ Fixed Past Appointments Filtering

I've successfully implemented filtering to prevent past appointments from being selectable in both the booking and reschedule forms. Here's what I changed:

### Changes Made:

1. **BookingPage.tsx**: Updated the `fetchAppointments` function to filter out past appointments before setting them in state
2. **ReschedulePage.tsx**: Applied the same filtering logic to the reschedule form

### How It Works:

- **Date Comparison**: The code compares each appointment's datetime with the current time
- **Filtering Logic**: Only appointments with a datetime greater than the current time are shown
- **Real-time Filtering**: This happens every time appointments are fetched, so past appointments are automatically excluded

### Code Changes:

```typescript
// Filter out past appointments
const futureAppointments = response.data.filter((appointment: Appointment) => {
  const appointmentDate = new Date(appointment.datetime);
  return appointmentDate > now;
});
```

### Benefits:

- **User Experience**: Users can no longer accidentally select past appointment times
- **Data Integrity**: Prevents invalid bookings for times that have already passed
- **Automatic Updates**: As time passes, past appointments are automatically removed from the selection list
- **Consistent Behavior**: Both booking and rescheduling forms now have the same filtering logic

The filtering is applied on the frontend, so it's immediate and doesn't require any backend changes. Past appointments will no longer appear in the dropdown selection or the available appointments list.

```typescript
// Filter out past appointments
const futureAppointments = response.data.filter((appointment: Appointment) => {
  const appointmentDate = new Date(appointment.datetime);
  return appointmentDate > now;
});
```

---
