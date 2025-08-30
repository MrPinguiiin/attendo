import { PrismaClient, UserRole, BillingCycle, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Clear existing data (optional)
    console.log('🧹 Clearing existing data...');
    await prisma.user.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.companySettings.deleteMany();
    await prisma.officeLocation.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.plan.deleteMany();
    console.log('✅ Existing data cleared');
    
    console.log('📋 Creating plans...');
    const basicPlan = await prisma.plan.create({
      data: {
        name: 'Basic',
        price: 99000, 
        billingCycle: BillingCycle.MONTHLY,
        maxUsers: 10,
        features: [
          'Up to 10 users',
          'Basic attendance tracking',
          'Monthly reports',
          'Email support',
        ],
      },
    });
    console.log('✅ Basic plan created:', basicPlan.id);

    const proPlan = await prisma.plan.create({
      data: {
        name: 'Pro',
        price: 199000,
        billingCycle: BillingCycle.MONTHLY,
        maxUsers: 50,
        features: [
          'Up to 50 users',
          'Advanced attendance tracking',
          'Real-time reports',
          'Location-based check-in',
          'Leave management',
          'Priority support',
        ],
      },
    });
    console.log('✅ Pro plan created:', proPlan.id);

    const enterprisePlan = await prisma.plan.create({
      data: {
        name: 'Enterprise',
        price: 499000, 
        billingCycle: BillingCycle.MONTHLY,
        maxUsers: -1, 
        features: [
          'Unlimited users',
          'All Pro features',
          'Custom integrations',
          'Advanced analytics',
          '24/7 phone support',
          'Dedicated account manager',
        ],
      },
    });
    console.log('✅ Enterprise plan created:', enterprisePlan.id);

    // Create Super Admin User
    console.log('👤 Creating super admin...');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const superAdmin = await prisma.user.create({
      data: {
        fullName: 'Super Administrator',
        email: 'superadmin@saas-attendance.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
      },
    });
    console.log('✅ Super admin created:', superAdmin.id);

    // Create Demo Company
    console.log('🏢 Creating demo company...');
    const demoCompany = await prisma.company.create({
      data: {
        name: 'Demo Company',
        address: 'Jl. Demo No. 123, Jakarta',
        phone: '+62-21-12345678',
        registrationCode: 'DEMO001',
      },
    });
    console.log('✅ Demo company created:', demoCompany.id);

    // Create Company Settings for Demo Company
    console.log('⚙️ Creating company settings...');
    await prisma.companySettings.create({
      data: {
        companyId: demoCompany.id,
        latenessToleranceMinutes: 15,
        overtimeRateWeekday: 1.5,
        overtimeRateWeekend: 2.0,
        allowWfh: true,
        wfhClockInNeedsLocation: false,
      },
    });
    console.log('✅ Company settings created');

    // Create Subscription for Demo Company
    console.log('💳 Creating subscription...');
    const demoSubscription = await prisma.subscription.create({
      data: {
        companyId: demoCompany.id,
        planId: proPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Demo subscription created:', demoSubscription.id);

    // Create Company Admin for Demo Company
    console.log('👨‍💼 Creating company admin...');
    const companyAdmin = await prisma.user.create({
      data: {
        fullName: 'Company Administrator',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: UserRole.COMPANY_ADMIN,
        companyId: demoCompany.id,
      },
    });
    console.log('✅ Company admin created:', companyAdmin.id);

    // Create Demo Employees
    console.log('👥 Creating demo employees...');
    const employees = [
      {
        fullName: 'John Doe',
        email: 'john@demo.com',
      },
      {
        fullName: 'Jane Smith',
        email: 'jane@demo.com',
      },
      {
        fullName: 'Bob Johnson',
        email: 'bob@demo.com',
      },
    ];

    for (const employee of employees) {
      const createdEmployee = await prisma.user.create({
        data: {
          ...employee,
          password: hashedPassword,
          role: UserRole.EMPLOYEE,
          companyId: demoCompany.id,
        },
      });
      console.log(`✅ Employee created: ${createdEmployee.fullName} (${createdEmployee.id})`);
    }

    // Create Office Locations
    console.log('📍 Creating office location...');
    const officeLocation = await prisma.officeLocation.create({
      data: {
        name: 'Main Office',
        address: 'Jl. Demo No. 123, Jakarta Pusat',
        latitude: -6.2088,
        longitude: 106.8456,
        radiusMeters: 100,
        companyId: demoCompany.id,
      },
    });
    console.log('✅ Office location created:', officeLocation.id);

    // Create Shifts
    console.log('⏰ Creating shifts...');
    const morningShift = await prisma.shift.create({
      data: {
        name: 'Shift Pagi',
        startTime: '08:00',
        endTime: '17:00',
        companyId: demoCompany.id,
      },
    });
    console.log('✅ Morning shift created:', morningShift.id);

    const afternoonShift = await prisma.shift.create({
      data: {
        name: 'Shift Siang',
        startTime: '14:00',
        endTime: '22:00',
        companyId: demoCompany.id,
      },
    });
    console.log('✅ Afternoon shift created:', afternoonShift.id);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('Super Admin: superadmin@saas-attendance.com / admin123');
    console.log('Company Admin: admin@demo.com / admin123');
    console.log('Employee: john@demo.com / admin123');
    console.log('Employee: jane@demo.com / admin123');
    console.log('Employee: bob@demo.com / admin123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

main();
