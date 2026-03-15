const NAMES = [
    'Arjun Sharma', 'Priya Patel', 'Rahul Verma', 'Sunita Reddy', 'Vikram Singh',
    'Kavya Nair', 'Ravi Kumar', 'Ananya Iyer', 'Suresh Gupta', 'Meera Joshi',
    'Karthik Rao', 'Divya Menon', 'Amit Tyagi', 'Pooja Srivastava', 'Nikhil Desai',
    'Sneha Agarwal', 'Rohit Malhotra', 'Deepa Bhat', 'Arun Pillai', 'Lakshmi Chandran',
];
const DEPTS = ['Engineering', 'Marketing', 'Finance', 'HR', 'Sales', 'Operations'];
const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
const DOMAINS = ['gmail.com', 'outlook.com', 'company.in', 'techcorp.com'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate() {
    const d = new Date(Date.now() - randInt(0, 8 * 365) * 86400000);
    return d.toISOString().split('T')[0];
}

export function generateMockEmployees(count = 200) {
    return Array.from({ length: count }, (_, i) => {
        const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : '');
        const email = name.toLowerCase().replace(/\s+/g, '.') + '@' + rand(DOMAINS);
        return {
            id: i + 1,
            name,
            email,
            department: rand(DEPTS),
            salary: randInt(25000, 150000),
            city: rand(CITIES),
            joinDate: randDate(),
        };
    });
}
