import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clinic Settings
  await prisma.clinicSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Dr. Osmanov',
      address: 'г. Махачкала, ул. Ярагского, 45',
      phone: '+78722123456',
      email: 'info@drosmanov.ru',
      bonusPercent: 5,
    },
  });

  // 2. Owner
  const owner = await prisma.user.upsert({
    where: { phone: '+79001234567' },
    update: {},
    create: {
      phone: '+79001234567',
      name: 'Османов Рамазан Магомедович',
      role: 'OWNER',
    },
  });

  // 3. Staff
  const staff1 = await prisma.user.upsert({
    where: { phone: '+79007654321' },
    update: {},
    create: {
      phone: '+79007654321',
      name: 'Иванова Анна Сергеевна',
      role: 'STAFF',
      staffProfile: {
        create: {
          specialty: 'Терапевт',
          bio: 'Стаж 10 лет. Специализация: лечение кариеса, пульпита.',
          salary: 80000,
          workSchedule: {
            mon: { start: '09:00', end: '18:00' },
            tue: { start: '09:00', end: '18:00' },
            wed: null,
            thu: { start: '09:00', end: '18:00' },
            fri: { start: '09:00', end: '16:00' },
            sat: null,
            sun: null,
          },
        },
      },
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { phone: '+79003334455' },
    update: {},
    create: {
      phone: '+79003334455',
      name: 'Петров Константин Владимирович',
      role: 'STAFF',
      staffProfile: {
        create: {
          specialty: 'Хирург',
          bio: 'Стаж 15 лет. Удаление, имплантация.',
          salary: 100000,
          workSchedule: {
            mon: { start: '10:00', end: '19:00' },
            tue: null,
            wed: { start: '10:00', end: '19:00' },
            thu: null,
            fri: { start: '10:00', end: '17:00' },
            sat: { start: '10:00', end: '14:00' },
            sun: null,
          },
        },
      },
    },
  });

  const staff3 = await prisma.user.upsert({
    where: { phone: '+79009876543' },
    update: {},
    create: {
      phone: '+79009876543',
      name: 'Сидорова Мария Игоревна',
      role: 'STAFF',
      staffProfile: {
        create: {
          specialty: 'Ортодонт',
          bio: 'Стаж 8 лет. Брекет-системы, элайнеры.',
          salary: 90000,
          workSchedule: {
            mon: null,
            tue: { start: '09:00', end: '17:00' },
            wed: { start: '09:00', end: '17:00' },
            thu: { start: '09:00', end: '17:00' },
            fri: null,
            sat: { start: '10:00', end: '14:00' },
            sun: null,
          },
        },
      },
    },
  });

  // 4. Clients
  const clientPhones = [
    { phone: '+79001111111', name: 'Магомедов Рамазан Ахмедович' },
    { phone: '+79002222222', name: 'Алиева Фатима Расуловна' },
    { phone: '+79003333333', name: 'Гаджиев Тимур Русланович' },
    { phone: '+79004444444', name: 'Курбанова Зарема Магомедовна' },
    { phone: '+79005555555', name: 'Исмаилов Руслан Камилевич' },
    { phone: '+79006666666', name: 'Абдулаева Патимат Шамиловна' },
    { phone: '+79007777777', name: 'Хасбулатов Мурад Заурович' },
    { phone: '+79008888888', name: 'Рабаданова Аминат Гаджиевна' },
    { phone: '+79009999999', name: 'Шамилов Арсен Магомедович' },
    { phone: '+79001010101', name: 'Магомедова Хадижат Ибрагимовна' },
  ];

  for (const c of clientPhones) {
    await prisma.user.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        phone: c.phone,
        name: c.name,
        role: 'CLIENT',
        clientProfile: {
          create: {
            birthDate: new Date(1985 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            bonusBalance: Math.floor(Math.random() * 3000),
            address: 'г. Махачкала',
          },
        },
      },
    });
  }

  // 5. Services
  const services = [
    { name: 'Лечение кариеса', price: 3000, duration: 60, category: 'Терапия', sortOrder: 1 },
    { name: 'Лечение пульпита', price: 7000, duration: 90, category: 'Терапия', sortOrder: 2 },
    { name: 'Удаление зуба простое', price: 3500, duration: 30, category: 'Хирургия', sortOrder: 1 },
    { name: 'Удаление зуба сложное', price: 6000, duration: 60, category: 'Хирургия', sortOrder: 2 },
    { name: 'Профессиональная чистка', price: 5000, duration: 60, category: 'Гигиена', sortOrder: 1 },
    { name: 'Отбеливание', price: 15000, duration: 90, category: 'Гигиена', sortOrder: 2 },
    { name: 'Консультация ортодонта', price: 1500, duration: 30, category: 'Ортодонтия', sortOrder: 1 },
    { name: 'Установка брекетов', price: 45000, duration: 120, category: 'Ортодонтия', sortOrder: 2 },
    { name: 'Консультация имплантолога', price: 0, duration: 30, category: 'Имплантация', sortOrder: 1, description: 'Бесплатная консультация' },
    { name: 'Установка импланта', price: 60000, duration: 120, category: 'Имплантация', sortOrder: 2 },
    { name: 'Виниры', price: 25000, duration: 90, category: 'Эстетика', sortOrder: 1 },
    { name: 'Реставрация зуба', price: 8000, duration: 60, category: 'Эстетика', sortOrder: 2 },
    { name: 'Панорамный снимок', price: 1500, duration: 15, category: 'Терапия', sortOrder: 3 },
    { name: 'Установка коронки', price: 18000, duration: 60, category: 'Эстетика', sortOrder: 3 },
    { name: 'Лечение дёсен', price: 4000, duration: 45, category: 'Терапия', sortOrder: 4 },
  ];

  for (const s of services) {
    await prisma.service.create({ data: s });
  }

  // Get created entities for appointments
  const allStaff = await prisma.staff.findMany();
  const allClients = await prisma.client.findMany();
  const allServices = await prisma.service.findMany();

  // 6. Appointments (30 - mix of statuses, past and future)
  const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

  for (let i = 0; i < 30; i++) {
    const isPast = i < 20;
    const daysOffset = isPast ? -(Math.floor(Math.random() * 60) + 1) : Math.floor(Math.random() * 14) + 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + daysOffset);
    startDate.setHours(9 + Math.floor(Math.random() * 8), Math.random() > 0.5 ? 0 : 30, 0, 0);

    const service = allServices[Math.floor(Math.random() * allServices.length)];
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + service.duration);

    const status = isPast
      ? (['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'][Math.floor(Math.random() * 5)] as typeof statuses[number])
      : (['PENDING', 'CONFIRMED'][Math.floor(Math.random() * 2)] as typeof statuses[number]);

    await prisma.appointment.create({
      data: {
        clientId: allClients[Math.floor(Math.random() * allClients.length)].id,
        staffId: allStaff[Math.floor(Math.random() * allStaff.length)].id,
        serviceId: service.id,
        startTime: startDate,
        endTime: endDate,
        status,
        reminderSent: isPast,
        cancelReason: status === 'CANCELLED' ? 'Пациент отменил' : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
      },
    });
  }

  // 7. Payments for COMPLETED appointments
  const completedAppointments = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    include: { service: true, client: true },
  });

  for (const apt of completedAppointments) {
    const bonusEarned = Math.floor(apt.service.price * 0.05);

    await prisma.payment.create({
      data: {
        appointmentId: apt.id,
        amount: apt.service.price,
        method: ['CASH', 'CARD', 'CASH', 'CARD'][Math.floor(Math.random() * 4)] as 'CASH' | 'CARD',
        status: 'PAID',
        bonusUsed: 0,
        bonusEarned,
        processedBy: apt.staffId,
      },
    });
  }

  // 8. MedRecords
  const diagnoses = [
    { diagnosis: 'Кариес 36 зуба', treatment: 'Пломбирование композитом', teeth: { '36': 'filled' } },
    { diagnosis: 'Пульпит 24 зуба', treatment: 'Эндодонтическое лечение, пломба', teeth: { '24': 'filled' } },
    { diagnosis: 'Зубной камень', treatment: 'Профессиональная гигиена полости рта', teeth: {} },
    { diagnosis: 'Перелом 11 зуба', treatment: 'Реставрация композитом', teeth: { '11': 'crown' } },
    { diagnosis: 'Периодонтит 46 зуба', treatment: 'Удаление зуба', teeth: { '46': 'extracted' } },
  ];

  for (const d of diagnoses) {
    await prisma.medRecord.create({
      data: {
        clientId: allClients[Math.floor(Math.random() * allClients.length)].id,
        staffId: allStaff[Math.floor(Math.random() * allStaff.length)].id,
        diagnosis: d.diagnosis,
        treatment: d.treatment,
        teethMap: d.teeth,
      },
    });
  }

  // 9. Audit log samples
  await prisma.auditLog.create({
    data: {
      userId: owner.id,
      action: 'POST /api/services',
      entity: 'services',
      newValue: { name: 'Лечение кариеса', price: 3000 },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: owner.id,
      action: 'PATCH /api/settings',
      entity: 'settings',
      newValue: { bonusPercent: 5 },
    },
  });

  console.log('Seeding completed!');
  console.log('');
  console.log('=== Учётные данные (для OTP входа) ===');
  console.log('Owner:   +79001234567');
  console.log('Staff 1: +79007654321 (Терапевт Иванова А.С.)');
  console.log('Staff 2: +79003334455 (Хирург Петров К.В.)');
  console.log('Staff 3: +79009876543 (Ортодонт Сидорова М.И.)');
  console.log('Client 1: +79001111111 (Магомедов Рамазан А.)');
  console.log('=======================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
