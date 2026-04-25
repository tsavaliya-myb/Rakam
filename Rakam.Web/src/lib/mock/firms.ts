export interface FirmDetails {
  id: string;
  name: string;
  ownerName?: string;
  gstNo?: string;
  panNo?: string;
  gstPercent?: string;
  mobilePrimary?: string;
  mobileSecondary?: string;
  msmeNo?: string;
  fullAddress: string;
  state: string;
  city?: string;
  pincode?: string;
  isDefault: boolean;
  watermark: boolean;
  logo: boolean;
  signature: boolean;
  // Bank details
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  accountType?: string;
  accountNo?: string;
  ifscCode?: string;
  // Dispatch addresses
  dispatchAddresses: DispatchAddress[];
  // Assets
  logoUrl?: string;
  watermarkUrl?: string;
  signatureUrl?: string;
  udhyamCertUrl?: string;
}

export interface DispatchAddress {
  id: string;
  dispatchName: string;
  address: string;
  city?: string;
  state: string;
  pin?: string;
}

export const MOCK_FIRMS: FirmDetails[] = [
  {
    id: "firm1",
    name: "Shreeji Enterprises",
    ownerName: "Rakesh Mehta",
    gstNo: "27AABCM1234A1Z5",
    panNo: "AABCM1234A",
    gstPercent: "18%",
    mobilePrimary: "9876543210",
    mobileSecondary: "9988776655",
    msmeNo: "MH-23-0012345",
    fullAddress: "123 Ring Road, Andheri East",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400069",
    isDefault: true,
    watermark: true,
    logo: true,
    signature: false,
    bankName: "State Bank of India",
    branchName: "Andheri East Branch",
    accountHolderName: "Shreeji Enterprises",
    accountType: "Current",
    accountNo: "12345678901",
    ifscCode: "SBIN0001234",
    dispatchAddresses: [
      {
        id: "da1",
        dispatchName: "Main Warehouse",
        address: "Plot 12, MIDC Industrial Area",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400093",
      },
    ],
    logoUrl: undefined,
    watermarkUrl: undefined,
    signatureUrl: undefined,
  },
];
