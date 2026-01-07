// Check localStorage for Mark Jiang
console.log('=== Checking localStorage for Mark Jiang ===');

// Check all localStorage keys
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

// Check for appointments data
const appointmentsData = localStorage.getItem('appointments');
if (appointmentsData) {
    try {
        const appointments = JSON.parse(appointmentsData);
        console.log('Appointments in localStorage:', appointments);

        // Search for Mark Jiang
        for (const [date, appts] of Object.entries(appointments)) {
            if (Array.isArray(appts)) {
                const markJiang = appts.filter(a =>
                    a.patientName && a.patientName.toLowerCase().includes('mark')
                );
                if (markJiang.length > 0) {
                    console.log(`Found Mark Jiang on ${date}:`, markJiang);
                }
            }
        }
    } catch (e) {
        console.error('Error parsing appointments:', e);
    }
} else {
    console.log('No appointments data in localStorage');
}

// Check pendingConfirmations
const pendingData = localStorage.getItem('pendingConfirmations');
if (pendingData) {
    try {
        const pending = JSON.parse(pendingData);
        console.log('Pending confirmations:', pending);
        const markJiang = pending.filter(a =>
            a.patientName && a.patientName.toLowerCase().includes('mark')
        );
        if (markJiang.length > 0) {
            console.log('Found Mark Jiang in pending:', markJiang);
        }
    } catch (e) {
        console.error('Error parsing pending:', e);
    }
}