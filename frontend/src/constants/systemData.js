// frontend/src/constants/systemData.js
const universities = [
  // Mogadishu
  { key: 'snu', name: 'Somali National University' },
  { key: 'simad', name: 'Jaamacadda Simad' },
  { key: 'mu', name: 'Jaamacadda Muqdisho' },
  { key: 'benadir', name: 'Jaamacadda Benadir' },
  { key: 'just', name: 'Jaamacadda Jamhuuriya (JUST)' },
  { key: 'hormuud', name: 'Jaamacadda Hormuud' },
  { key: 'zamzam', name: 'Jaamacadda Zamzam' },
  { key: 'kismayo_u', name: 'Jaamacadda Kismaayo' },
  // Somaliland
  { key: 'hargeisa_u', name: 'Jaamacadda Hargeysa' },
  { key: 'amoud', name: 'Jaamacadda Amuud (Borama)' },
  { key: 'gollis', name: 'Jaamacadda Gollis' },
  { key: 'togdheer', name: 'Jaamacadda Togdheer (Burco)' },
  // Puntland
  { key: 'puntland_su', name: 'Jaamacadda Gobolka Puntland (Garoowe)' },
  { key: 'nugaal_u', name: 'Jaamacadda Nugaal (Garoowe)' },
  { key: 'east_africa_u', name: 'Jaamacadda Bariga Afrika (Boosaaso)' },
  { key: 'galkayo_u', name: 'Jaamacadda Gaalkacyo' },

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
      { key: 'networking', name: 'Networking & IT' },
    ],
  },
  {
    key: 'engineering',
    name: 'Engineering',
    subs: [
      { key: 'civil_eng', name: 'Civil Engineering' },
      { key: 'electrical_eng', name: 'Electrical Engineering' },
      { key: 'mechanical_eng', name: 'Mechanical Engineering' },
      { key: 'architecture', name: 'Architecture' },
    ],
  },
  {
    key: 'business_freelancing_marketing',
    name: 'Business, Freelancing & Marketing',
    subs: [
      { key: 'digital_marketing', name: 'Digital Marketing' },
      { key: 'startups', name: 'Startups' },
      { key: 'ecommerce', name: 'E-commerce' },
      { key: 'management', name: 'Business Management' },
    ],
  },
  {
    key: 'economics_finance',
    name: 'Economics & Finance',
    subs: [
      { key: 'economics', name: 'Economics' },
      { key: 'accounting', name: 'Accounting' },
      { key: 'banking', name: 'Banking & Finance' },
    ],
  },
  {
    key: 'health_medical_sciences',
    name: 'Health & Medical Sciences',
    subs: [
      { key: 'medicine', name: 'Medicine' },
      { key: 'public_health', name: 'Public Health' },
      { key: 'nursing', name: 'Nursing' },
      { key: 'pharmacy', name: 'Pharmacy' },
    ],
  },
  {
    key: 'law_sharia',
    name: 'Law & Sharia',
    subs: [
      { key: 'civil_law', name: 'Civil Law' },
      { key: 'islamic_law', name: 'Islamic Law (Sharia)' },
    ],
  },
  {
    key: 'education',
    name: 'Education & Teaching',
    subs: [
      { key: 'primary_ed', name: 'Primary Education' },
      { key: 'secondary_ed', name: 'Secondary Education' },
      { key: 'arabic_ed', name: 'Arabic & Islamic Education' },
    ],
  },
  {
    key: 'social_sciences_humanities',
    name: 'Social Sciences & Humanities',
    subs: [
      { key: 'political_science', name: 'Political Science' },
      { key: 'sociology', name: 'Sociology' },
      { key: 'journalism', name: 'Journalism & Media' },
      { key: 'somali_language', name: 'Somali Language & Literature' },
    ],
  },
  {
    key: 'agriculture_environment',
    name: 'Agriculture & Environment',
    subs: [
      { key: 'agronomy', name: 'Agronomy' },
      { key: 'animal_husbandry', name: 'Animal Husbandry' },
      { key: 'environment', name: 'Environmental Science' },
    ],
  },
];

const DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

export { universities, faculties, DAYS };
