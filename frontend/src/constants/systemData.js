const universities = [
  { key: 'snu', name: 'Somali National University (Jaamacadda Qaranka)' },
  { key: 'simad', name: 'Jaamacadda Simad' },
  { key: 'mu', name: 'Jaamacadda Muqdisho' },
  { key: 'umadda', name: 'Jaamacadda Umadda' },
  { key: 'other', name: 'Other / Not listed' },
];

const faculties = [
  {
    key: 'computer_science_technology',
    name: 'Computer Science & Technology',
    subs: [
      { key: 'ai', name: 'AI' },
      { key: 'software_dev', name: 'Software Development' },
      { key: 'cybersecurity', name: 'Cybersecurity' },
      { key: 'multimedia', name: 'Multimedia' },
    ],
  },
  {
    key: 'business_freelancing_marketing',
    name: 'Business, Freelancing & Marketing',
    subs: [
      { key: 'digital_marketing', name: 'Digital Marketing' },
      { key: 'startups', name: 'Startups' },
      { key: 'ecommerce', name: 'E-commerce' },
    ],
  },
  {
    key: 'health_medical_sciences',
    name: 'Health & Medical Sciences',
    subs: [
      { key: 'medicine', name: 'Medicine' },
      { key: 'public_health', name: 'Public Health' },
      { key: 'nursing', name: 'Nursing' },
    ],
  },
];

export { universities, faculties };
