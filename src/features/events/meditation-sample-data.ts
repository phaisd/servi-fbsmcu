export interface SampleMeditationAttendee {
  studentCode: string;
  studentName: string;
  major: string;
  groupNumber: number;
  groupName: string;
  program: "THAI" | "ENGLISH";
  role: "STUDENT" | "TEACHER";
  yearLevel: number;
  department: string;
}

export const SAMPLE_ENGLISH_ATTENDEES: SampleMeditationAttendee[] = [
  { studentCode: "E1201", studentName: "Vo Le Anh Tuan", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1202", studentName: "Do Tan An", major: "RePhi", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 1, department: "ภาควิชาศาสนาและปรัชญา (อินเตอร์)" },
  { studentCode: "E1203", studentName: "Nguyen Quoc Trung", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1204", studentName: "Tran Quang Tu", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1205", studentName: "Nguyen Tan Dat", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1206", studentName: "Huynh Xvan Vinh", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1207", studentName: "Bhikkhuni Kalaganwaththe Padmananda Silmathawa", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1208", studentName: "Bhikkhuni Le Thi Phuong Nhi", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1209", studentName: "Bhikkhuni Nguyen Thi Anh", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1210", studentName: "Bhikkhuni Quach Thi Diu", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1211", studentName: "Bhikkhuni Tran Thi My Hau", major: "Bud.", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา (อินเตอร์)" },
  { studentCode: "E1212", studentName: "Miss Rupasi Chakma", major: "RePhi", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา (อินเตอร์)" },
  { studentCode: "E1213", studentName: "Miss Jesy Chakma", major: "RePhi", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา (อินเตอร์)" },
  { studentCode: "E1214", studentName: "Mr. Khun Maung Chan Aung", major: "RePhi", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา (อินเตอร์)" },
  { studentCode: "E1215", studentName: "Mr. Supan Chakma", major: "RePhi", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา (อินเตอร์)" },
  { studentCode: "E1216", studentName: "Mr. Janaka Udayawansa Lanka Purayalage", major: "RePhi", groupNumber: 12, groupName: "Group : 12", program: "ENGLISH", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา (อินเตอร์)" },
];

export const SAMPLE_THAI_ATTENDEES: SampleMeditationAttendee[] = [
  // กลุ่มที่ 1
  { studentCode: "T101", studentName: "พระสมุห์วิชัย วิชโย", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T102", studentName: "พระครูปลัดศรัณย์กร ปยุตฺโต", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T103", studentName: "พระ Savin Sujitto", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T104", studentName: "พระมหาอาทิตย์ อภิธมฺโม", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T105", studentName: "พระดำรงพล กตปุญฺโญ", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T106", studentName: "พระภาสกร ปญฺญาคโม", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T107", studentName: "พระมหาพิพิธธน ครุธมฺโม", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T108", studentName: "พระมหาชนุดม อุตฺตมวํโส", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T109", studentName: "พระสมชาย ปญฺญาธโร", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T110", studentName: "พระ Pandita", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T111", studentName: "พระมหาวชิรวิทย์ ธนวุฑฺโฒ", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T112", studentName: "พระปิยะวุฒิ ชาตสํวโร", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T113", studentName: "พระสมศักดิ์ วํสเวชฺโช", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T114", studentName: "พระ Siha", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T115", studentName: "พระ Kusala", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T116", studentName: "พระทรงสิทธิ์ จิตฺตคุโณ", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T117", studentName: "พระบุญธรรม สุขวิชฺโช", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T123", studentName: "พระวีระชัย วีรปญฺโญ", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T118", studentName: "พระสายัน สารโท", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T119", studentName: "สามเณรพชร พรมมี", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T120", studentName: "สามเณรนนทภัทร ผาทา", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T121", studentName: "สามเณรณรงค์กร แจ้งถิ่นป่า", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T122", studentName: "สามเณรพัชรพล เจริญเกียรติ", major: "พุทธศาสน์", groupNumber: 1, groupName: "กลุ่มที่ 1", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },

  // กลุ่มที่ 2
  { studentCode: "T201", studentName: "Bounmy Xaymonty", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T202", studentName: "พระพิเชษฐ์ เตชปญฺโญ", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T203", studentName: "พระมหากุศล กุสลจิตฺโต", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T204", studentName: "พระจิรทีปต์ อภิชาโน", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T205", studentName: "พระนพดล จินตามโย", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T206", studentName: "พระครูสมุห์รัชกฤช ภทฺทปญฺโญ", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T207", studentName: "พระมหาสาลี สีลสาโร", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T208", studentName: "พระ Thach Bach Tra", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T209", studentName: "พระสุทธิพัฒน์ สุทธฺจิตฺโต", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T210", studentName: "พระดรุษกร ธีรปญฺโญ", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T211", studentName: "พระ Tuan Yan", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T212", studentName: "พระจิรวัฒน์ อาภากโร", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T213", studentName: "พระวีรวิชญ์ กตฺสาโร", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T214", studentName: "พระเจษฎา อภิเจโต", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T215", studentName: "พระกฤษฎา ปญฺญาวโร", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T216", studentName: "พระมหามนตรี สุตมนตโร", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T217", studentName: "พระสุพรรณ แฮล", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T218", studentName: "สามเณรอภิสร ใสสะอาด", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T219", studentName: "สามเณรภูบดินทร กาวิจา", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T220", studentName: "สามเณรจักรกฤษณ์ เพชรนคร", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T221", studentName: "สามเณรนวพล ธิมานิตย์", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },
  { studentCode: "T222", studentName: "สามเณร Kong Vimonchit", major: "ศาสนาและปรัชญา", groupNumber: 2, groupName: "กลุ่มที่ 2", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาศาสนาและปรัชญา" },

  // กลุ่มที่ 3
  { studentCode: "T301", studentName: "พระพานเงิน มหาปุญฺโญ", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T302", studentName: "พระมหาอุเทน อุเทโน", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T303", studentName: "พระญาณกิตติ์ อตฺถกาโร", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T304", studentName: "พระมหานราธิป ชินวโร", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T305", studentName: "พระพันธิ์ศักดิ์ วรสกฺโก", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T306", studentName: "พระ Zawtika", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T307", studentName: "พระธนชิต สุจิตฺโต", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T308", studentName: "พระ Bounxou Keomeuangxay", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T309", studentName: "พระ Vasava", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T310", studentName: "พระมหาศุภัช มหาวีโร", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T311", studentName: "พระสุริยกมล ปภาโส", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T312", studentName: "พระมงคล สนฺตมโน", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T313", studentName: "Ven. Kittiphong Innakhone", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T314", studentName: "พระมหาณัฐพนธ์ กตพุทฺธิ", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T315", studentName: "พระมหาฐิติพงศ์ สุทฺธิโสภโณ", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T316", studentName: "พระ Thach Nang", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T317", studentName: "พระควงพันธ์ อภิปุญฺญเตโช", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T318", studentName: "สามเณรกิตติพัฒน์ พุ่มพวง", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 1, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T319", studentName: "สามเณรยมมะลา อ่อนอินทร์", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 2, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T320", studentName: "สามเณรโชคดี ขุนจันทร์", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 3, department: "ภาควิชาพระพุทธศาสนา" },
  { studentCode: "T321", studentName: "สามเณร Panyavara", major: "พุทธศาสน์", groupNumber: 3, groupName: "กลุ่มที่ 3", program: "THAI", role: "STUDENT", yearLevel: 4, department: "ภาควิชาพระพุทธศาสนา" },
];
