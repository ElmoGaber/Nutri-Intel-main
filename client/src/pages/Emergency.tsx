import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Phone, Plus, Trash2, AlertCircle, X, Loader2, ChevronDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── World country codes ──────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+93",   flag: "🇦🇫", nameAr: "أفغانستان",         nameEn: "Afghanistan" },
  { code: "+355",  flag: "🇦🇱", nameAr: "ألبانيا",            nameEn: "Albania" },
  { code: "+213",  flag: "🇩🇿", nameAr: "الجزائر",            nameEn: "Algeria" },
  { code: "+376",  flag: "🇦🇩", nameAr: "أندورا",             nameEn: "Andorra" },
  { code: "+244",  flag: "🇦🇴", nameAr: "أنغولا",             nameEn: "Angola" },
  { code: "+1268", flag: "🇦🇬", nameAr: "أنتيغوا وباربودا",   nameEn: "Antigua & Barbuda" },
  { code: "+54",   flag: "🇦🇷", nameAr: "الأرجنتين",          nameEn: "Argentina" },
  { code: "+374",  flag: "🇦🇲", nameAr: "أرمينيا",            nameEn: "Armenia" },
  { code: "+61",   flag: "🇦🇺", nameAr: "أستراليا",           nameEn: "Australia" },
  { code: "+43",   flag: "🇦🇹", nameAr: "النمسا",             nameEn: "Austria" },
  { code: "+994",  flag: "🇦🇿", nameAr: "أذربيجان",           nameEn: "Azerbaijan" },
  { code: "+1242", flag: "🇧🇸", nameAr: "جزر البهاما",        nameEn: "Bahamas" },
  { code: "+973",  flag: "🇧🇭", nameAr: "البحرين",            nameEn: "Bahrain" },
  { code: "+880",  flag: "🇧🇩", nameAr: "بنغلاديش",           nameEn: "Bangladesh" },
  { code: "+1246", flag: "🇧🇧", nameAr: "باربادوس",           nameEn: "Barbados" },
  { code: "+375",  flag: "🇧🇾", nameAr: "بيلاروسيا",          nameEn: "Belarus" },
  { code: "+32",   flag: "🇧🇪", nameAr: "بلجيكا",             nameEn: "Belgium" },
  { code: "+501",  flag: "🇧🇿", nameAr: "بليز",               nameEn: "Belize" },
  { code: "+229",  flag: "🇧🇯", nameAr: "بنين",               nameEn: "Benin" },
  { code: "+975",  flag: "🇧🇹", nameAr: "بوتان",              nameEn: "Bhutan" },
  { code: "+591",  flag: "🇧🇴", nameAr: "بوليفيا",            nameEn: "Bolivia" },
  { code: "+387",  flag: "🇧🇦", nameAr: "البوسنة والهرسك",    nameEn: "Bosnia & Herzegovina" },
  { code: "+267",  flag: "🇧🇼", nameAr: "بوتسوانا",           nameEn: "Botswana" },
  { code: "+55",   flag: "🇧🇷", nameAr: "البرازيل",           nameEn: "Brazil" },
  { code: "+673",  flag: "🇧🇳", nameAr: "بروناي",             nameEn: "Brunei" },
  { code: "+359",  flag: "🇧🇬", nameAr: "بلغاريا",            nameEn: "Bulgaria" },
  { code: "+226",  flag: "🇧🇫", nameAr: "بوركينا فاسو",       nameEn: "Burkina Faso" },
  { code: "+257",  flag: "🇧🇮", nameAr: "بوروندي",            nameEn: "Burundi" },
  { code: "+238",  flag: "🇨🇻", nameAr: "الرأس الأخضر",       nameEn: "Cape Verde" },
  { code: "+855",  flag: "🇰🇭", nameAr: "كمبوديا",            nameEn: "Cambodia" },
  { code: "+237",  flag: "🇨🇲", nameAr: "الكاميرون",          nameEn: "Cameroon" },
  { code: "+1",    flag: "🇨🇦", nameAr: "كندا",               nameEn: "Canada" },
  { code: "+236",  flag: "🇨🇫", nameAr: "أفريقيا الوسطى",     nameEn: "Central African Rep." },
  { code: "+235",  flag: "🇹🇩", nameAr: "تشاد",               nameEn: "Chad" },
  { code: "+56",   flag: "🇨🇱", nameAr: "شيلي",               nameEn: "Chile" },
  { code: "+86",   flag: "🇨🇳", nameAr: "الصين",              nameEn: "China" },
  { code: "+57",   flag: "🇨🇴", nameAr: "كولومبيا",           nameEn: "Colombia" },
  { code: "+269",  flag: "🇰🇲", nameAr: "جزر القمر",          nameEn: "Comoros" },
  { code: "+242",  flag: "🇨🇬", nameAr: "الكونغو",            nameEn: "Congo" },
  { code: "+243",  flag: "🇨🇩", nameAr: "الكونغو الديمقراطية",nameEn: "Congo (DRC)" },
  { code: "+506",  flag: "🇨🇷", nameAr: "كوستاريكا",          nameEn: "Costa Rica" },
  { code: "+385",  flag: "🇭🇷", nameAr: "كرواتيا",            nameEn: "Croatia" },
  { code: "+53",   flag: "🇨🇺", nameAr: "كوبا",               nameEn: "Cuba" },
  { code: "+357",  flag: "🇨🇾", nameAr: "قبرص",               nameEn: "Cyprus" },
  { code: "+420",  flag: "🇨🇿", nameAr: "التشيك",             nameEn: "Czech Republic" },
  { code: "+45",   flag: "🇩🇰", nameAr: "الدنمارك",           nameEn: "Denmark" },
  { code: "+253",  flag: "🇩🇯", nameAr: "جيبوتي",             nameEn: "Djibouti" },
  { code: "+1767", flag: "🇩🇲", nameAr: "دومينيكا",           nameEn: "Dominica" },
  { code: "+1809", flag: "🇩🇴", nameAr: "الدومينيكان",        nameEn: "Dominican Republic" },
  { code: "+593",  flag: "🇪🇨", nameAr: "الإكوادور",          nameEn: "Ecuador" },
  { code: "+20",   flag: "🇪🇬", nameAr: "مصر",                nameEn: "Egypt" },
  { code: "+503",  flag: "🇸🇻", nameAr: "السلفادور",          nameEn: "El Salvador" },
  { code: "+240",  flag: "🇬🇶", nameAr: "غينيا الاستوائية",   nameEn: "Equatorial Guinea" },
  { code: "+291",  flag: "🇪🇷", nameAr: "إريتريا",            nameEn: "Eritrea" },
  { code: "+372",  flag: "🇪🇪", nameAr: "إستونيا",            nameEn: "Estonia" },
  { code: "+268",  flag: "🇸🇿", nameAr: "إسواتيني",           nameEn: "Eswatini" },
  { code: "+251",  flag: "🇪🇹", nameAr: "إثيوبيا",            nameEn: "Ethiopia" },
  { code: "+679",  flag: "🇫🇯", nameAr: "فيجي",               nameEn: "Fiji" },
  { code: "+358",  flag: "🇫🇮", nameAr: "فنلندا",             nameEn: "Finland" },
  { code: "+33",   flag: "🇫🇷", nameAr: "فرنسا",              nameEn: "France" },
  { code: "+241",  flag: "🇬🇦", nameAr: "الغابون",            nameEn: "Gabon" },
  { code: "+220",  flag: "🇬🇲", nameAr: "غامبيا",             nameEn: "Gambia" },
  { code: "+995",  flag: "🇬🇪", nameAr: "جورجيا",             nameEn: "Georgia" },
  { code: "+49",   flag: "🇩🇪", nameAr: "ألمانيا",            nameEn: "Germany" },
  { code: "+233",  flag: "🇬🇭", nameAr: "غانا",               nameEn: "Ghana" },
  { code: "+30",   flag: "🇬🇷", nameAr: "اليونان",            nameEn: "Greece" },
  { code: "+1473", flag: "🇬🇩", nameAr: "غرينادا",            nameEn: "Grenada" },
  { code: "+502",  flag: "🇬🇹", nameAr: "غواتيمالا",          nameEn: "Guatemala" },
  { code: "+224",  flag: "🇬🇳", nameAr: "غينيا",              nameEn: "Guinea" },
  { code: "+245",  flag: "🇬🇼", nameAr: "غينيا بيساو",        nameEn: "Guinea-Bissau" },
  { code: "+592",  flag: "🇬🇾", nameAr: "غيانا",              nameEn: "Guyana" },
  { code: "+509",  flag: "🇭🇹", nameAr: "هايتي",              nameEn: "Haiti" },
  { code: "+504",  flag: "🇭🇳", nameAr: "هندوراس",            nameEn: "Honduras" },
  { code: "+36",   flag: "🇭🇺", nameAr: "المجر",              nameEn: "Hungary" },
  { code: "+354",  flag: "🇮🇸", nameAr: "آيسلندا",            nameEn: "Iceland" },
  { code: "+91",   flag: "🇮🇳", nameAr: "الهند",              nameEn: "India" },
  { code: "+62",   flag: "🇮🇩", nameAr: "إندونيسيا",          nameEn: "Indonesia" },
  { code: "+98",   flag: "🇮🇷", nameAr: "إيران",              nameEn: "Iran" },
  { code: "+964",  flag: "🇮🇶", nameAr: "العراق",             nameEn: "Iraq" },
  { code: "+353",  flag: "🇮🇪", nameAr: "أيرلندا",            nameEn: "Ireland" },
  { code: "+972",  flag: "🇮🇱", nameAr: "إسرائيل",            nameEn: "Israel" },
  { code: "+39",   flag: "🇮🇹", nameAr: "إيطاليا",            nameEn: "Italy" },
  { code: "+1876", flag: "🇯🇲", nameAr: "جامايكا",            nameEn: "Jamaica" },
  { code: "+81",   flag: "🇯🇵", nameAr: "اليابان",            nameEn: "Japan" },
  { code: "+962",  flag: "🇯🇴", nameAr: "الأردن",             nameEn: "Jordan" },
  { code: "+7",    flag: "🇰🇿", nameAr: "كازاخستان",          nameEn: "Kazakhstan" },
  { code: "+254",  flag: "🇰🇪", nameAr: "كينيا",              nameEn: "Kenya" },
  { code: "+686",  flag: "🇰🇮", nameAr: "كيريباتي",           nameEn: "Kiribati" },
  { code: "+850",  flag: "🇰🇵", nameAr: "كوريا الشمالية",     nameEn: "North Korea" },
  { code: "+82",   flag: "🇰🇷", nameAr: "كوريا الجنوبية",     nameEn: "South Korea" },
  { code: "+965",  flag: "🇰🇼", nameAr: "الكويت",             nameEn: "Kuwait" },
  { code: "+996",  flag: "🇰🇬", nameAr: "قيرغيزستان",         nameEn: "Kyrgyzstan" },
  { code: "+856",  flag: "🇱🇦", nameAr: "لاوس",               nameEn: "Laos" },
  { code: "+371",  flag: "🇱🇻", nameAr: "لاتفيا",             nameEn: "Latvia" },
  { code: "+961",  flag: "🇱🇧", nameAr: "لبنان",              nameEn: "Lebanon" },
  { code: "+266",  flag: "🇱🇸", nameAr: "ليسوتو",             nameEn: "Lesotho" },
  { code: "+231",  flag: "🇱🇷", nameAr: "ليبيريا",            nameEn: "Liberia" },
  { code: "+218",  flag: "🇱🇾", nameAr: "ليبيا",              nameEn: "Libya" },
  { code: "+423",  flag: "🇱🇮", nameAr: "ليختنشتاين",         nameEn: "Liechtenstein" },
  { code: "+370",  flag: "🇱🇹", nameAr: "ليتوانيا",           nameEn: "Lithuania" },
  { code: "+352",  flag: "🇱🇺", nameAr: "لوكسمبورغ",          nameEn: "Luxembourg" },
  { code: "+261",  flag: "🇲🇬", nameAr: "مدغشقر",             nameEn: "Madagascar" },
  { code: "+265",  flag: "🇲🇼", nameAr: "ملاوي",              nameEn: "Malawi" },
  { code: "+60",   flag: "🇲🇾", nameAr: "ماليزيا",            nameEn: "Malaysia" },
  { code: "+960",  flag: "🇲🇻", nameAr: "المالديف",           nameEn: "Maldives" },
  { code: "+223",  flag: "🇲🇱", nameAr: "مالي",               nameEn: "Mali" },
  { code: "+356",  flag: "🇲🇹", nameAr: "مالطا",              nameEn: "Malta" },
  { code: "+692",  flag: "🇲🇭", nameAr: "جزر مارشال",         nameEn: "Marshall Islands" },
  { code: "+222",  flag: "🇲🇷", nameAr: "موريتانيا",          nameEn: "Mauritania" },
  { code: "+230",  flag: "🇲🇺", nameAr: "موريشيوس",           nameEn: "Mauritius" },
  { code: "+52",   flag: "🇲🇽", nameAr: "المكسيك",            nameEn: "Mexico" },
  { code: "+691",  flag: "🇫🇲", nameAr: "ميكرونيزيا",         nameEn: "Micronesia" },
  { code: "+373",  flag: "🇲🇩", nameAr: "مولدوفا",            nameEn: "Moldova" },
  { code: "+377",  flag: "🇲🇨", nameAr: "موناكو",             nameEn: "Monaco" },
  { code: "+976",  flag: "🇲🇳", nameAr: "منغوليا",            nameEn: "Mongolia" },
  { code: "+382",  flag: "🇲🇪", nameAr: "الجبل الأسود",       nameEn: "Montenegro" },
  { code: "+212",  flag: "🇲🇦", nameAr: "المغرب",             nameEn: "Morocco" },
  { code: "+258",  flag: "🇲🇿", nameAr: "موزمبيق",            nameEn: "Mozambique" },
  { code: "+95",   flag: "🇲🇲", nameAr: "ميانمار",            nameEn: "Myanmar" },
  { code: "+264",  flag: "🇳🇦", nameAr: "ناميبيا",            nameEn: "Namibia" },
  { code: "+674",  flag: "🇳🇷", nameAr: "ناورو",              nameEn: "Nauru" },
  { code: "+977",  flag: "🇳🇵", nameAr: "نيبال",              nameEn: "Nepal" },
  { code: "+31",   flag: "🇳🇱", nameAr: "هولندا",             nameEn: "Netherlands" },
  { code: "+64",   flag: "🇳🇿", nameAr: "نيوزيلندا",          nameEn: "New Zealand" },
  { code: "+505",  flag: "🇳🇮", nameAr: "نيكاراغوا",          nameEn: "Nicaragua" },
  { code: "+227",  flag: "🇳🇪", nameAr: "النيجر",             nameEn: "Niger" },
  { code: "+234",  flag: "🇳🇬", nameAr: "نيجيريا",            nameEn: "Nigeria" },
  { code: "+389",  flag: "🇲🇰", nameAr: "مقدونيا",            nameEn: "North Macedonia" },
  { code: "+47",   flag: "🇳🇴", nameAr: "النرويج",            nameEn: "Norway" },
  { code: "+968",  flag: "🇴🇲", nameAr: "عُمان",              nameEn: "Oman" },
  { code: "+92",   flag: "🇵🇰", nameAr: "باكستان",            nameEn: "Pakistan" },
  { code: "+680",  flag: "🇵🇼", nameAr: "بالاو",              nameEn: "Palau" },
  { code: "+970",  flag: "🇵🇸", nameAr: "فلسطين",             nameEn: "Palestine" },
  { code: "+507",  flag: "🇵🇦", nameAr: "بنما",               nameEn: "Panama" },
  { code: "+675",  flag: "🇵🇬", nameAr: "بابوا غينيا الجديدة",nameEn: "Papua New Guinea" },
  { code: "+595",  flag: "🇵🇾", nameAr: "باراغواي",           nameEn: "Paraguay" },
  { code: "+51",   flag: "🇵🇪", nameAr: "بيرو",               nameEn: "Peru" },
  { code: "+63",   flag: "🇵🇭", nameAr: "الفلبين",            nameEn: "Philippines" },
  { code: "+48",   flag: "🇵🇱", nameAr: "بولندا",             nameEn: "Poland" },
  { code: "+351",  flag: "🇵🇹", nameAr: "البرتغال",           nameEn: "Portugal" },
  { code: "+974",  flag: "🇶🇦", nameAr: "قطر",                nameEn: "Qatar" },
  { code: "+40",   flag: "🇷🇴", nameAr: "رومانيا",            nameEn: "Romania" },
  { code: "+7",    flag: "🇷🇺", nameAr: "روسيا",              nameEn: "Russia" },
  { code: "+250",  flag: "🇷🇼", nameAr: "رواندا",             nameEn: "Rwanda" },
  { code: "+1869", flag: "🇰🇳", nameAr: "سانت كيتس ونيفيس",  nameEn: "Saint Kitts & Nevis" },
  { code: "+1758", flag: "🇱🇨", nameAr: "سانت لوسيا",         nameEn: "Saint Lucia" },
  { code: "+1784", flag: "🇻🇨", nameAr: "سانت فنسنت",         nameEn: "Saint Vincent" },
  { code: "+685",  flag: "🇼🇸", nameAr: "ساموا",              nameEn: "Samoa" },
  { code: "+378",  flag: "🇸🇲", nameAr: "سان مارينو",         nameEn: "San Marino" },
  { code: "+239",  flag: "🇸🇹", nameAr: "ساو تومي",           nameEn: "São Tomé & Príncipe" },
  { code: "+966",  flag: "🇸🇦", nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia" },
  { code: "+221",  flag: "🇸🇳", nameAr: "السنغال",            nameEn: "Senegal" },
  { code: "+381",  flag: "🇷🇸", nameAr: "صربيا",              nameEn: "Serbia" },
  { code: "+248",  flag: "🇸🇨", nameAr: "سيشيل",              nameEn: "Seychelles" },
  { code: "+232",  flag: "🇸🇱", nameAr: "سيراليون",           nameEn: "Sierra Leone" },
  { code: "+65",   flag: "🇸🇬", nameAr: "سنغافورة",           nameEn: "Singapore" },
  { code: "+421",  flag: "🇸🇰", nameAr: "سلوفاكيا",           nameEn: "Slovakia" },
  { code: "+386",  flag: "🇸🇮", nameAr: "سلوفينيا",           nameEn: "Slovenia" },
  { code: "+677",  flag: "🇸🇧", nameAr: "جزر سليمان",         nameEn: "Solomon Islands" },
  { code: "+252",  flag: "🇸🇴", nameAr: "الصومال",            nameEn: "Somalia" },
  { code: "+27",   flag: "🇿🇦", nameAr: "جنوب أفريقيا",       nameEn: "South Africa" },
  { code: "+211",  flag: "🇸🇸", nameAr: "جنوب السودان",       nameEn: "South Sudan" },
  { code: "+34",   flag: "🇪🇸", nameAr: "إسبانيا",            nameEn: "Spain" },
  { code: "+94",   flag: "🇱🇰", nameAr: "سريلانكا",           nameEn: "Sri Lanka" },
  { code: "+249",  flag: "🇸🇩", nameAr: "السودان",            nameEn: "Sudan" },
  { code: "+597",  flag: "🇸🇷", nameAr: "سورينام",            nameEn: "Suriname" },
  { code: "+46",   flag: "🇸🇪", nameAr: "السويد",             nameEn: "Sweden" },
  { code: "+41",   flag: "🇨🇭", nameAr: "سويسرا",             nameEn: "Switzerland" },
  { code: "+963",  flag: "🇸🇾", nameAr: "سوريا",              nameEn: "Syria" },
  { code: "+886",  flag: "🇹🇼", nameAr: "تايوان",             nameEn: "Taiwan" },
  { code: "+992",  flag: "🇹🇯", nameAr: "طاجيكستان",          nameEn: "Tajikistan" },
  { code: "+255",  flag: "🇹🇿", nameAr: "تنزانيا",            nameEn: "Tanzania" },
  { code: "+66",   flag: "🇹🇭", nameAr: "تايلاند",            nameEn: "Thailand" },
  { code: "+670",  flag: "🇹🇱", nameAr: "تيمور الشرقية",      nameEn: "Timor-Leste" },
  { code: "+228",  flag: "🇹🇬", nameAr: "توغو",               nameEn: "Togo" },
  { code: "+676",  flag: "🇹🇴", nameAr: "تونغا",              nameEn: "Tonga" },
  { code: "+1868", flag: "🇹🇹", nameAr: "ترينيداد وتوباغو",   nameEn: "Trinidad & Tobago" },
  { code: "+216",  flag: "🇹🇳", nameAr: "تونس",               nameEn: "Tunisia" },
  { code: "+90",   flag: "🇹🇷", nameAr: "تركيا",              nameEn: "Turkey" },
  { code: "+993",  flag: "🇹🇲", nameAr: "تركمانستان",         nameEn: "Turkmenistan" },
  { code: "+688",  flag: "🇹🇻", nameAr: "توفالو",             nameEn: "Tuvalu" },
  { code: "+256",  flag: "🇺🇬", nameAr: "أوغندا",             nameEn: "Uganda" },
  { code: "+380",  flag: "🇺🇦", nameAr: "أوكرانيا",           nameEn: "Ukraine" },
  { code: "+971",  flag: "🇦🇪", nameAr: "الإمارات",           nameEn: "UAE" },
  { code: "+44",   flag: "🇬🇧", nameAr: "المملكة المتحدة",    nameEn: "United Kingdom" },
  { code: "+1",    flag: "🇺🇸", nameAr: "الولايات المتحدة",   nameEn: "United States" },
  { code: "+598",  flag: "🇺🇾", nameAr: "أوروغواي",           nameEn: "Uruguay" },
  { code: "+998",  flag: "🇺🇿", nameAr: "أوزبكستان",          nameEn: "Uzbekistan" },
  { code: "+678",  flag: "🇻🇺", nameAr: "فانواتو",            nameEn: "Vanuatu" },
  { code: "+39",   flag: "🇻🇦", nameAr: "الفاتيكان",          nameEn: "Vatican City" },
  { code: "+58",   flag: "🇻🇪", nameAr: "فنزويلا",            nameEn: "Venezuela" },
  { code: "+84",   flag: "🇻🇳", nameAr: "فيتنام",             nameEn: "Vietnam" },
  { code: "+967",  flag: "🇾🇪", nameAr: "اليمن",              nameEn: "Yemen" },
  { code: "+260",  flag: "🇿🇲", nameAr: "زامبيا",             nameEn: "Zambia" },
  { code: "+263",  flag: "🇿🇼", nameAr: "زيمبابوي",           nameEn: "Zimbabwe" },
];

// ── Country Code Dropdown Component ─────────────────────────────────────────
function CountryCodeSelect({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (code: string) => void;
  language: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0];

  const filtered = search
    ? COUNTRY_CODES.filter(
        (c) =>
          c.nameAr.includes(search) ||
          c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : COUNTRY_CODES;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-input bg-background hover:bg-accent transition-colors text-sm font-medium whitespace-nowrap min-w-[90px]"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs">{selected.code}</span>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 start-0 w-72 rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <Input
              autoFocus
              placeholder={language === "ar" ? "ابحث عن دولة..." : "Search country..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="overflow-y-auto max-h-60">
            {filtered.map((c) => (
              <button
                key={`${c.code}-${c.nameEn}`}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-start ${
                  c.code === value ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{language === "ar" ? c.nameAr : c.nameEn}</span>
                <span className="text-xs text-muted-foreground shrink-0">{c.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {language === "ar" ? "لا توجد نتائج" : "No results"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const LS_CONTACTS = "nutri_emergency_contacts";


function lsGetContacts(): any[] {
  try { return JSON.parse(localStorage.getItem(LS_CONTACTS) || "[]"); } catch { return []; }
}
function lsSetContacts(list: any[]) {
  try { localStorage.setItem(LS_CONTACTS, JSON.stringify(list)); } catch {}
}
// ── Main Page ────────────────────────────────────────────────────────────────
export default function Emergency() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    countryCode: "+966",
    relationship: "",
    isPrimary: false,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const r = await fetch("/api/emergency/contacts", { credentials: "include" });
      const server: any[] = r.ok ? await r.json() : [];
      if (server.length > 0) { lsSetContacts(server); return server; }
      return lsGetContacts();
    },
    initialData: lsGetContacts,
  });

  const addContact = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch("/api/emergency/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: (newContact) => {
      qc.setQueryData(["emergency-contacts"], (old: any[]) => {
        const updated = [...(old ?? []), newContact];
        lsSetContacts(updated);
        return updated;
      });
      setNewContact({ name: "", phone: "", countryCode: "+966", relationship: "", isPrimary: false });
      setShowAddForm(false);
      toast({
        title: language === "ar" ? "تمت الإضافة" : "Added",
        description: language === "ar" ? "تمت إضافة جهة اتصال الطوارئ" : "Emergency contact added",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل إضافة جهة الاتصال" : "Failed to add contact",
      });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/emergency/contacts/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: (_, id) => {
      qc.setQueryData(["emergency-contacts"], (old: any[]) => {
        const updated = (old ?? []).filter((c: any) => c.id !== id);
        lsSetContacts(updated);
        return updated;
      });
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى ملء الاسم ورقم الهاتف" : "Name and phone are required",
      });
      return;
    }
    const fullPhone = `${newContact.countryCode}${newContact.phone.replace(/^0+/, "")}`;
    addContact.mutate({
      name: newContact.name.trim(),
      phone: fullPhone,
      countryCode: newContact.countryCode,
      relationship: newContact.relationship.trim(),
      isPrimary: contacts.length === 0,
    });
  };

  const getCountryInfo = (code: string) =>
    COUNTRY_CODES.find((c) => c.code === code);

  const isLoading = contactsLoading;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">
          {t("emergencyTitle")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("emergencyContactDesc")}</p>
      </div>

      {/* Warning Banner */}
      <div className="glass-card p-4 bg-red-500/5 border-s-4 border-red-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">{t("emergencyContactsCritical")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("keepContactsUpdated")}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Add Contact Form */}
          {showAddForm ? (
            <div className="glass-card p-6 border-s-4 border-blue-500 bg-blue-500/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">
                  {language === "ar" ? "إضافة جهة اتصال طوارئ" : "Add Emergency Contact"}
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    {language === "ar" ? "الاسم الكامل *" : "Full Name *"}
                  </label>
                  <Input
                    placeholder={language === "ar" ? "مثال: محمد أحمد" : "e.g. John Smith"}
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    {language === "ar" ? "رقم الهاتف *" : "Phone Number *"}
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={newContact.countryCode}
                      onChange={(code) => setNewContact({ ...newContact, countryCode: code })}
                      language={language}
                    />
                    <Input
                      dir="ltr"
                      type="tel"
                      placeholder={language === "ar" ? "5xxxxxxxx" : "5xxxxxxxx"}
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact({ ...newContact, phone: e.target.value.replace(/[^\d\s\-]/g, "") })
                      }
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 dir-ltr text-start">
                    {language === "ar" ? "سيُحفظ كـ: " : "Will be saved as: "}
                    <span className="font-medium text-foreground">
                      {newContact.countryCode}{newContact.phone.replace(/^0+/, "") || "5xxxxxxxx"}
                    </span>
                  </p>
                </div>

                {/* Relationship */}
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    {language === "ar" ? "صلة القرابة" : "Relationship"}
                  </label>
                  <Input
                    placeholder={language === "ar" ? "مثال: أخ، طبيب، زوج/ة" : "e.g. Brother, Doctor, Spouse"}
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddContact}
                  disabled={addContact.isPending}
                >
                  {addContact.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                  ) : (
                    <Plus className="w-4 h-4 me-2" />
                  )}
                  {language === "ar" ? "حفظ جهة الاتصال" : "Save Contact"}
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" size="lg" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 me-2" />
              {t("addContact")}
            </Button>
          )}

          {/* Contacts List */}
          {contacts.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">
                {language === "ar" ? "لا توجد جهات اتصال طوارئ بعد" : "No emergency contacts yet"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {language === "ar"
                  ? "أضف جهات الاتصال المهمة للوصول السريع في الطوارئ"
                  : "Add important contacts for quick access in emergencies"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                {language === "ar" ? `جهات الاتصال (${contacts.length})` : `Contacts (${contacts.length})`}
              </h2>
              {contacts.map((contact: any) => {
                const countryInfo = contact.countryCode ? getCountryInfo(contact.countryCode) : null;
                return (
                  <div
                    key={contact.id}
                    className={`glass-card p-4 transition-all ${
                      contact.isPrimary ? "border-s-4 border-red-500 bg-red-500/3" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate">{contact.name}</h3>
                          {contact.isPrimary && (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full shrink-0">
                              <Star className="w-3 h-3" />
                              {t("primary")}
                            </span>
                          )}
                        </div>
                        {contact.relationship && (
                          <p className="text-sm text-muted-foreground mt-0.5">{contact.relationship}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {countryInfo && (
                            <span className="text-base leading-none" title={language === "ar" ? countryInfo.nameAr : countryInfo.nameEn}>
                              {countryInfo.flag}
                            </span>
                          )}
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={`tel:${contact.phone}`}
                            dir="ltr"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                      <button
                        className="p-2 hover:bg-red-500/10 rounded-lg transition shrink-0"
                        onClick={() => deleteContact.mutate(contact.id)}
                        disabled={deleteContact.isPending}
                        title={language === "ar" ? "حذف" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </>
      )}
    </div>
  );
}
