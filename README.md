# MyPetGame.Project
## วิดีโอสาธิตการทำงาน
สามารถรับชมวิดีโอตัวอย่างเกมได้ที่นี่: 
👉 [คลิกเพื่อดูวิดีโอสาธิตการทำงาน](https://youtu.be/5e77zk2-J6g?si=UX3pGlmBOlIk6CZC)

# 🐾 My Pet Token — Web3 Pet Game

**My Pet Token** เป็นเกมเลี้ยงสัตว์เสมือนจริงที่พัฒนาบนเว็บไซต์ โดยประยุกต์ใช้เทคโนโลยี Web3 และ Blockchain ร่วมกับ **PET Token (ERC-20)** สำหรับระบบรางวัลภารกิจและการซื้อไอเทมภายในเกม ผ่าน Smart Contracts บน BNB Smart Chain Testnet

---

## 🎯 1. วัตถุประสงค์ของโปรเจกต์ (Project Objectives)

โปรเจกต์นี้จัดทำขึ้นเพื่อศึกษาและพัฒนาทักษะด้าน Web Development, Game Development และ Blockchain โดยมุ่งเน้นการเชื่อมต่อระหว่างเว็บไซต์ กระเป๋าเงิน MetaMask และ Smart Contracts เพื่อจัดการธุรกรรมโทเคนภายในเกม

---

## 🌟 2. ฟีเจอร์หลักของเกม (Key Features)

* **Virtual Pet System:** เลือกสัตว์เลี้ยงได้ 4 ชนิด ได้แก่ แมว สุนัข คาปิบาร่า และกระต่าย
* **Pet Activities:** ดูแลสัตว์เลี้ยงด้วยการให้อาหาร เล่นบอล สั่งนั่ง และพาเดินเล่น
* **Mission & Rewards:** ทำภารกิจเพื่อรับ PET Token ตามเงื่อนไขที่กำหนด
* **Shop & Inventory:** ใช้ PET Token ซื้อเครื่องประดับ เฟอร์นิเจอร์ และฉากตกแต่งภายในเกม
* **Web3 Integration:** เชื่อมต่อ MetaMask เพื่อตรวจสอบยอดโทเคนและทำธุรกรรมบน BNB Smart Chain Testnet

---

## 📌 3. สถาปัตยกรรมระบบ (System Architecture)

ระบบแบ่งการจัดการกระเป๋าเงินออกเป็น 2 ส่วนหลัก ได้แก่:

* **Wallet A (Admin / Treasury Wallet):**  
  กระเป๋าของผู้ดูแลระบบ ใช้จัดการ PET Token และโอนเหรียญสำรองเข้าสู่ RewardContract เพื่อเป็นกองทุนสำหรับจ่ายรางวัลให้ผู้เล่น

* **Wallet B (Player / MetaMask Wallet):**  
  กระเป๋าของผู้เล่นที่เชื่อมต่อกับเว็บไซต์ ใช้รับ PET Token จากภารกิจ ตรวจสอบยอดโทเคน และอนุมัติการใช้โทเคนผ่านฟังก์ชัน `approve()` เพื่อซื้อไอเทมภายในเกม

---

## 📜 4. สรุปการทำงานของ Smart Contracts

โปรเจกต์พัฒนาด้วยภาษา Solidity และประกอบด้วย Smart Contracts หลัก 3 สัญญา:

* 🪙 **PETToken.sol — ระบบโทเคน:**  
  เป็นสัญญาโทเคนมาตรฐาน ERC-20 สำหรับใช้เป็นสกุลเงินภายในเกม รองรับการตรวจสอบยอดคงเหลือ การโอนโทเคน และการอนุมัติให้ Smart Contract ใช้โทเคนตามจำนวนที่กำหนด

* 🎁 **RewardContract.sol — ระบบรางวัล:**  
  จัดการกองทุน PET Token และการจ่ายรางวัลให้ผู้เล่นผ่านภารกิจ โดยตรวจสอบเงื่อนไขและสถานะการรับรางวัล เพื่อป้องกันการรับรางวัลซ้ำตามข้อกำหนดของ Smart Contract

* 🛒 **ShopContract.sol — ระบบร้านค้า:**  
  จัดการรายการสินค้า ราคา และการซื้อไอเทมภายในเกม โดยผู้เล่นใช้ PET Token ชำระค่าสินค้าผ่าน Smart Contract และระบบบันทึกข้อมูลการซื้อสำหรับตรวจสอบรายการไอเทมของผู้เล่น

---

### 🔗 Smart Contract Addresses (BNB Smart Chain Testnet)

| Smart Contract | BscScan Link |
| :--- | :--- |
| **PETToken** *(สัญญาที่เกมและร้านค้าอ้างอิง)* | View PET Token |
| **RewardContract** | View RewardContract |
| **ShopContract** | View ShopContract |

---

## 🎨 5. ระบบแสดงผล (Canvas Animation Engine)

เกมใช้ HTML5 Canvas ในการวาดตัวละครสัตว์เลี้ยงและแสดงภาพเคลื่อนไหว โดยมีการคำนวณพิกัดขององค์ประกอบต่าง ๆ เช่น หัว ลำตัว หู ตา และตำแหน่งเครื่องประดับ เพื่อให้ตัวละครและไอเทมตกแต่งแสดงผลร่วมกันได้อย่างเหมาะสม

---

## 📋 6. ระบบภารกิจและรางวัล (Mission System)

ผู้เล่นสามารถทำกิจกรรมภายในเกม เช่น ให้อาหาร เล่นกับสัตว์เลี้ยง พาเดินเล่น สั่งนั่ง และซื้อไอเทม เพื่อทำภารกิจให้สำเร็จ

เมื่อผ่านเงื่อนไขที่กำหนด ผู้เล่นสามารถกดรับ PET Token ผ่านระบบรางวัลที่เชื่อมต่อกับ RewardContract โดยธุรกรรมที่สำเร็จสามารถตรวจสอบได้บน BscScan Testnet

---

## 🛠️ 7. วิธีการใช้งานและทดสอบ (Getting Started)

1. **Deploy Smart Contracts:** Deploy สัญญา PETToken, RewardContract และ ShopContract บน BNB Smart Chain Testnet ผ่าน Remix IDE
2. **Setup Reserve:** จัดเตรียม PET Token ใน RewardContract เพื่อใช้เป็นกองทุนรางวัล
3. **Configure Frontend:** กำหนด Contract Addresses ในไฟล์ JavaScript ให้ตรงกับสัญญาที่ Deploy
4. **Run Game:** เปิดโปรเจกต์ผ่าน Visual Studio Code และ Live Server
5. **Connect MetaMask:** เชื่อมต่อกระเป๋าเงินบนเครือข่าย Testnet เพื่อใช้งานฟีเจอร์ Blockchain หลังตรวจสอบความปลอดภัยของเว็บไซต์และธุรกรรม
