import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

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

  // 2. Owner — пароль: owner123
  const owner = await prisma.user.upsert({
    where: { phone: '+79001234567' },
    update: {},
    create: {
      phone: '+79001234567',
      passwordHash: await hashPassword('owner123'),
      name: 'Османов Рамазан Магомедович',
      role: 'OWNER',
    },
  });

  // 3. Staff — каждый со своим паролем
  // Терапевт — пароль: staff111
  await prisma.user.upsert({
    where: { phone: '+79007654321' },
    update: { name: 'Магомедова Асият Магомедовна' },
    create: {
      phone: '+79007654321',
      passwordHash: await hashPassword('staff111'),
      name: 'Магомедова Асият Магомедовна',
      role: 'STAFF',
      staffProfile: {
        create: {
          specialty: 'Терапевт',
          bio: 'Стаж 10 лет. Лечение кариеса, пульпита, эндодонтия.',
          salary: 80000,
          canManageServices: true,
          canManagePromotions: true,
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

  // Хирург — пароль: staff222
  await prisma.user.upsert({
    where: { phone: '+79003334455' },
    update: { name: 'Алиев Зайнудин Расулович' },
    create: {
      phone: '+79003334455',
      passwordHash: await hashPassword('staff222'),
      name: 'Алиев Зайнудин Расулович',
      role: 'STAFF',
      staffProfile: {
        create: {
          specialty: 'Хирург',
          bio: 'Стаж 15 лет. Удаление, имплантация.',
          salary: 100000,
          canManageSchedule: true,
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

  // Ортодонт — пароль: staff333
  await prisma.user.upsert({
    where: { phone: '+79009876543' },
    update: { name: 'Гаджиев Мурад Ахмедович' },
    create: {
      phone: '+79009876543',
      passwordHash: await hashPassword('staff333'),
      name: 'Гаджиев Мурад Ахмедович',
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

  // 4. Clients — каждый с паролем client123
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

  const clientPasswordHash = await hashPassword('client123');

  for (const c of clientPhones) {
    await prisma.user.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        phone: c.phone,
        passwordHash: clientPasswordHash,
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
    { name: 'Лечение кариеса', description: 'Лечение кариеса любой сложности с использованием современных материалов', price: 3000, duration: 60, category: 'Терапия', sortOrder: 1 },
    { name: 'Лечение пульпита', description: 'Эндодонтическое лечение каналов зуба', price: 7000, duration: 90, category: 'Терапия', sortOrder: 2 },
    { name: 'Удаление зуба простое', description: 'Удаление подвижного или однокорневого зуба', price: 3500, duration: 30, category: 'Хирургия', sortOrder: 1 },
    { name: 'Удаление зуба сложное', description: 'Удаление ретинированного или многокорневого зуба', price: 6000, duration: 60, category: 'Хирургия', sortOrder: 2 },
    { name: 'Профессиональная чистка', description: 'Ультразвуковая чистка + Air Flow + полировка', price: 5000, duration: 60, category: 'Гигиена', sortOrder: 1 },
    { name: 'Отбеливание', description: 'Профессиональное отбеливание ZOOM', price: 15000, duration: 90, category: 'Гигиена', sortOrder: 2 },
    { name: 'Консультация ортодонта', description: 'Осмотр, план лечения, фотопротокол', price: 1500, duration: 30, category: 'Ортодонтия', sortOrder: 1 },
    { name: 'Установка брекетов', description: 'Металлические или керамические брекеты на одну челюсть', price: 45000, duration: 120, category: 'Ортодонтия', sortOrder: 2 },
    { name: 'Консультация имплантолога', description: 'Бесплатная консультация с КТ-снимком', price: 0, duration: 30, category: 'Имплантация', sortOrder: 1 },
    { name: 'Установка импланта', description: 'Установка импланта Straumann / Osstem', price: 60000, duration: 120, category: 'Имплантация', sortOrder: 2 },
    { name: 'Виниры', description: 'Керамические виниры E.max за единицу', price: 25000, duration: 90, category: 'Эстетика', sortOrder: 1 },
    { name: 'Реставрация зуба', description: 'Художественная реставрация композитом', price: 8000, duration: 60, category: 'Эстетика', sortOrder: 2 },
    { name: 'Панорамный снимок', description: 'ОПТГ — панорамный рентген всех зубов', price: 1500, duration: 15, category: 'Терапия', sortOrder: 3 },
    { name: 'Установка коронки', description: 'Металлокерамическая или циркониевая коронка', price: 18000, duration: 60, category: 'Эстетика', sortOrder: 3 },
    { name: 'Лечение дёсен', description: 'Лечение гингивита и пародонтита', price: 4000, duration: 45, category: 'Терапия', sortOrder: 4 },
  ];

  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.service.create({ data: s });
  }

  // 5.1 Связь врачей с услугами по специальности
  const allStaffSvc = await prisma.staff.findMany({ include: { user: true } });
  const allSvc = await prisma.service.findMany();

  for (const st of allStaffSvc) {
    const spec = st.specialty.toLowerCase();
    // Определяем какие категории услуг оказывает врач
    let cats: string[] = [];
    if (spec.includes('терапевт')) cats = ['Терапия', 'Гигиена'];
    else if (spec.includes('хирург')) cats = ['Хирургия', 'Имплантация'];
    else if (spec.includes('ортодонт')) cats = ['Ортодонтия', 'Эстетика'];
    else cats = ['Терапия'];

    const matching = allSvc.filter((s) => cats.includes(s.category));
    for (const svc of matching) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: st.id, serviceId: svc.id } },
        create: { staffId: st.id, serviceId: svc.id },
        update: {},
      });
    }
  }

  // 6. Promotions (Акции)
  const now = new Date();
  const promotions = [
    {
      title: 'Бесплатная консультация',
      description: 'При первом посещении — бесплатная консультация и составление плана лечения для всех новых пациентов.',
      discount: null,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, 0),
    },
    {
      title: 'Скидка 20% на чистку зубов',
      description: 'Профессиональная гигиена полости рта со скидкой 20%. Ультразвук + Air Flow + полировка.',
      discount: 20,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
    {
      title: 'Семейная скидка 15%',
      description: 'При записи двух и более членов семьи — скидка 15% на все услуги.',
      discount: 15,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0),
    },
  ];

  for (const p of promotions) {
    const exists = await prisma.promotion.findFirst({ where: { title: p.title } });
    if (!exists) await prisma.promotion.create({ data: p });
  }

  // Get created entities for appointments
  const allStaff = await prisma.staff.findMany();
  const allClients = await prisma.client.findMany();
  const allServices = await prisma.service.findMany();

  // 7. Appointments — только если их ещё нет (идемпотентность)
  const existingApts = await prisma.appointment.count();
  for (let i = 0; i < (existingApts > 0 ? 0 : 30); i++) {
    const isPast = i < 20;
    const daysOffset = isPast ? -(Math.floor(Math.random() * 60) + 1) : Math.floor(Math.random() * 14) + 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + daysOffset);
    startDate.setHours(9 + Math.floor(Math.random() * 8), Math.random() > 0.5 ? 0 : 30, 0, 0);

    const service = allServices[Math.floor(Math.random() * allServices.length)];
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + service.duration);

    const status = isPast
      ? (['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'][Math.floor(Math.random() * 5)] as 'COMPLETED' | 'CANCELLED' | 'NO_SHOW')
      : (['PENDING', 'CONFIRMED'][Math.floor(Math.random() * 2)] as 'PENDING' | 'CONFIRMED');

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

  // 8. Payments for COMPLETED
  const completedAppointments = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    include: { service: true },
  });

  for (const apt of completedAppointments) {
    const bonusEarned = Math.floor(apt.service.price * 0.05);
    // Skip если уже есть оплата для этой записи
    const existing = await prisma.payment.findUnique({ where: { appointmentId: apt.id } });
    if (existing) continue;
    await prisma.payment.create({
      data: {
        appointmentId: apt.id,
        amount: apt.service.price,
        method: (['CASH', 'CARD'] as const)[Math.floor(Math.random() * 2)],
        status: 'PAID',
        bonusUsed: 0,
        bonusEarned,
        processedBy: apt.staffId,
      },
    });
  }

  // 9. MedRecords
  const diagnoses = [
    { diagnosis: 'Кариес 36 зуба', treatment: 'Пломбирование композитом', teeth: { '36': 'filled' } },
    { diagnosis: 'Пульпит 24 зуба', treatment: 'Эндодонтическое лечение, пломба', teeth: { '24': 'filled' } },
    { diagnosis: 'Зубной камень', treatment: 'Профессиональная гигиена полости рта', teeth: {} },
    { diagnosis: 'Перелом 11 зуба', treatment: 'Реставрация композитом', teeth: { '11': 'crown' } },
    { diagnosis: 'Периодонтит 46 зуба', treatment: 'Удаление зуба', teeth: { '46': 'extracted' } },
  ];

  const existingRecs = await prisma.medRecord.count();
  if (existingRecs === 0) {
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
  }

  // 10. Audit log samples (создаём только при первом сидировании)
  const existingAudit = await prisma.auditLog.count();
  if (existingAudit === 0) await prisma.auditLog.create({
    data: { userId: owner.id, action: 'POST /api/services', entity: 'services', newValue: { name: 'Лечение кариеса', price: 3000 } },
  });

  console.log('');
  console.log('========================================');
  console.log('   SEED COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log('');
  console.log('  ТЕСТОВЫЕ АККАУНТЫ:');
  console.log('  ──────────────────────────────────');
  console.log('  ВЛАДЕЛЕЦ:');
  console.log('    Телефон: +79001234567');
  console.log('    Пароль:  owner123');
  console.log('');
  console.log('  ВРАЧИ:');
  console.log('    Магомедова А.М. (Терапевт)');
  console.log('    Телефон: +79007654321 / Пароль: staff111');
  console.log('');
  console.log('    Алиев З.Р. (Хирург)');
  console.log('    Телефон: +79003334455 / Пароль: staff222');
  console.log('');
  console.log('    Гаджиев М.А. (Ортодонт)');
  console.log('    Телефон: +79009876543 / Пароль: staff333');
  console.log('');
  console.log('  ПАЦИЕНТЫ (все пароль: client123):');
  console.log('    +79001111111 — Магомедов Рамазан А.');
  console.log('    +79002222222 — Алиева Фатима Р.');
  console.log('    +79003333333 — Гаджиев Тимур Р.');
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
