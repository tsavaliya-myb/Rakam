// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MOCK_PARTIES: any[] = [
  { id: "p1", name: "Mehta Co.",          ownerName: "Rakesh Mehta",    gstNo: "27AABCM1234A1Z5", panCard: "AABCM1234A", address: "123 Ring Road, Andheri",       state: "Maharashtra", city: "Mumbai",     pincode: "400053", contactNumber: "9876543210", discount: 5,  dueDays: 15 },
  { id: "p2", name: "Patel Enterprises",  ownerName: "Suresh Patel",    gstNo: "24AADCP5678B1Z3", panCard: "AADCP5678B", address: "45 Industrial Area, Naroda",   state: "Gujarat",     city: "Ahmedabad",  pincode: "382330", contactNumber: "9988776655", discount: 0,  dueDays: 30 },
  { id: "p3", name: "Sharma Traders",     ownerName: "Vijay Sharma",    gstNo: "",                panCard: "AABCS9012C", address: "78 MG Road, Sector 14",        state: "Rajasthan",   city: "Jaipur",     pincode: "302001", contactNumber: "9112233445", discount: 2,  dueDays: 7  },
  { id: "p4", name: "Joshi Limited",      ownerName: "Manoj Joshi",     gstNo: "09AAECJ3456D1Z2", panCard: "AAECJ3456D", address: "22 Kanpur Road",               state: "Uttar Pradesh",city: "Lucknow",   pincode: "226001", contactNumber: "9876501234", discount: 0,  dueDays: 15 },
  { id: "p5", name: "Gupta & Co.",        ownerName: "Anil Gupta",      gstNo: "07AACCG7890E1Z8", panCard: "AACCG7890E", address: "56 Connaught Place",           state: "Delhi",       city: "New Delhi",  pincode: "110001", contactNumber: "9001122334", discount: 3,  dueDays: 45 },
  { id: "p6", name: "Desai Manufacturing",ownerName: "Hemant Desai",    gstNo: "24AAHCD2345F1Z1", panCard: "AAHCD2345F", address: "Plot 12, GIDC Phase 2",        state: "Gujarat",     city: "Surat",      pincode: "395010", contactNumber: "9988001122", discount: 0,  dueDays: 0  },
  { id: "p7", name: "Reddy Brothers",     ownerName: "Krishna Reddy",   gstNo: "36AAACR6789G1Z4", panCard: "AAACR6789G", address: "88 Banjara Hills, Road No. 2", state: "Telangana",   city: "Hyderabad",  pincode: "500034", contactNumber: "9345678901", discount: 1,  dueDays: 30 },
  { id: "p8", name: "Singh Fabrics",      ownerName: "Harpreet Singh",  gstNo: "03AADFS4567H1Z6", panCard: "AADFS4567H", address: "44 GT Road, Ludhiana",         state: "Punjab",      city: "Ludhiana",   pincode: "141001", contactNumber: "9876100200", discount: 4,  dueDays: 20 },
];

// Net balance: positive = we have to RECEIVE from them, negative = we have to PAY
export const PARTY_BALANCES: Record<string, number> = {
  p1: 100300,
  p2: 0,
  p3: -20000,
  p4: 79060,
  p5: 0,
  p6: 27500,
  p7: 82600,
  p8: -15000,
};
