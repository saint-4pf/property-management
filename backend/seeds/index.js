require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const query = (text, params) => pool.query(text, params);

const seed = async () => {
  console.log('🌱 Starting seed...\n');

  try {
    // Clear existing data in correct order
    await query('DELETE FROM maintenance_expenses');
    await query('DELETE FROM maintenance_records');
    await query('DELETE FROM transactions');
    await query('DELETE FROM leases');
    await query('DELETE FROM tenants');
    await query('DELETE FROM units');
    await query('DELETE FROM blocks');
    console.log('🧹 Cleared existing data');

    // ── BLOCKS ──────────────────────────────────
    const blockARes = await query(`
      INSERT INTO blocks (name, description)
      VALUES ('A', 'Main residential block')
      RETURNING id, name
    `);
    const blockBRes = await query(`
      INSERT INTO blocks (name, description)
      VALUES ('B', 'Commercial ground floor')
      RETURNING id, name
    `);
    const blockCRes = await query(`
      INSERT INTO blocks (name, description)
      VALUES ('C', 'New extension block')
      RETURNING id, name
    `);

    const blockA = blockARes.rows[0];
    const blockB = blockBRes.rows[0];
    const blockC = blockCRes.rows[0];
    console.log('✅ Blocks created');

    // ── UNITS — Block A ─────────────────────────
    await query(`
      INSERT INTO units
        (block_id, unit_number, unit_type,
         size_description, base_rent, status)
      VALUES
        ($1,'A1','residential','2 Bedroom',15000,'vacant'),
        ($1,'A2','residential','2 Bedroom',15000,'vacant'),
        ($1,'A3','residential','1 Bedroom',10000,'vacant'),
        ($1,'A4','residential','1 Bedroom',10000,'vacant')
    `, [blockA.id]);

    // ── UNITS — Block B ─────────────────────────
    await query(`
      INSERT INTO units
        (block_id, unit_number, unit_type,
         size_description, base_rent, status)
      VALUES
        ($1,'B1','commercial','Shop 20sqm',25000,'vacant'),
        ($1,'B2','commercial','Shop 20sqm',25000,'vacant'),
        ($1,'B3','commercial','Office',20000,'vacant')
    `, [blockB.id]);

    // ── UNITS — Block C ─────────────────────────
    await query(`
      INSERT INTO units
        (block_id, unit_number, unit_type,
         size_description, base_rent, status)
      VALUES
        ($1,'C1','residential','2 Bedroom',18000,'vacant'),
        ($1,'C2','residential','2 Bedroom',18000,'vacant'),
        ($1,'C3','residential','1 Bedroom',12000,'vacant')
    `, [blockC.id]);

    // Get all units
    const unitsRes = await query(
      'SELECT id, unit_number FROM units'
    );
    const units = unitsRes.rows;
    const getUnit = (num) =>
      units.find(u => u.unit_number === num);
    console.log('✅ Units created');

    // ── TENANTS ─────────────────────────────────
    const t1 = await query(`
      INSERT INTO tenants
        (full_name, phone, email,
         national_id, status)
      VALUES ($1,$2,$3,$4,'active')
      RETURNING id`,
      ['James Mwangi','0712345678',
       'james@email.com','12345678']
    );
    const t2 = await query(`
      INSERT INTO tenants
        (full_name, phone, email,
         national_id, status)
      VALUES ($1,$2,$3,$4,'active')
      RETURNING id`,
      ['Mary Njoroge','0723456789',
       'mary@email.com','23456789']
    );
    const t3 = await query(`
      INSERT INTO tenants
        (full_name, phone, email,
         national_id, status)
      VALUES ($1,$2,$3,$4,'active')
      RETURNING id`,
      ['Peter Kamau','0734567890',
       'peter@email.com','34567890']
    );
    const t4 = await query(`
      INSERT INTO tenants
        (full_name, phone, email,
         national_id, status)
      VALUES ($1,$2,$3,$4,'active')
      RETURNING id`,
      ['Grace Wanjiku','0745678901',
       'grace@email.com','45678901']
    );
    const t5 = await query(`
      INSERT INTO tenants
        (full_name, phone, email,
         national_id, status)
      VALUES ($1,$2,$3,$4,'active')
      RETURNING id`,
      ['David Omondi','0756789012',
       'david@email.com','56789012']
    );

    const tenants = [
      { id: t1.rows[0].id, name: 'James Mwangi',
        unit: 'A1', rent: 180000,
        water: 500, garbage: 300, deposit: 15000 },
      { id: t2.rows[0].id, name: 'Mary Njoroge',
        unit: 'A2', rent: 180000,
        water: 500, garbage: 300, deposit: 15000 },
      { id: t3.rows[0].id, name: 'Peter Kamau',
        unit: 'A3', rent: 120000,
        water: 400, garbage: 300, deposit: 10000 },
      { id: t4.rows[0].id, name: 'Grace Wanjiku',
        unit: 'C1', rent: 216000,
        water: 600, garbage: 300, deposit: 18000 },
      { id: t5.rows[0].id, name: 'David Omondi',
        unit: 'C2', rent: 216000,
        water: 600, garbage: 300, deposit: 18000 }
    ];
    console.log('✅ Tenants created');

    // ── LEASES ──────────────────────────────────
    const leases = [];
    for (const t of tenants) {
      const unit = getUnit(t.unit);
      const leaseRes = await query(`
        INSERT INTO leases
          (unit_id, tenant_id, annual_rent,
           water_monthly, garbage_monthly,
           deposit_amount, deposit_paid,
           start_date, end_date, status)
        VALUES
          ($1,$2,$3,$4,$5,$6,
           true,'2025-01-01','2025-12-31',
           'active')
        RETURNING id
      `, [
        unit.id, t.id, t.rent,
        t.water, t.garbage, t.deposit
      ]);

      await query(
        `UPDATE units SET status = 'occupied'
         WHERE id = $1`,
        [unit.id]
      );

      leases.push({
        id: leaseRes.rows[0].id,
        tenant_id: t.id,
        unit_id: unit.id,
        name: t.name,
        rent: t.rent
      });
    }
    console.log('✅ Leases created');

    // ── TRANSACTIONS ────────────────────────────

    // Deposits
    for (const l of leases) {
      await query(`
        INSERT INTO transactions
          (transaction_date, type, amount,
           account, category, lease_id,
           tenant_id, unit_id,
           payment_method, description)
        VALUES
          ('2025-01-01','income',15000,
           'rent','deposit',$1,$2,$3,
           'bank_transfer',$4)
      `, [l.id, l.tenant_id, l.unit_id,
          `Security deposit - ${l.name}`]);
    }

    // Rent payments
    await query(`
      INSERT INTO transactions
        (transaction_date, type, amount,
         account, category, lease_id,
         tenant_id, unit_id,
         payment_method, reference_number,
         description)
      VALUES
        ('2025-01-05','income',90000,
         'rent','rent',$1,$2,$3,
         'mpesa','MP001',
         'Rent payment Jan-Jun')
    `, [leases[0].id, leases[0].tenant_id,
        leases[0].unit_id]);

    await query(`
      INSERT INTO transactions
        (transaction_date, type, amount,
         account, category, lease_id,
         tenant_id, unit_id,
         payment_method, reference_number,
         description)
      VALUES
        ('2025-01-05','income',180000,
         'rent','rent',$1,$2,$3,
         'bank_transfer','BT001',
         'Full annual rent payment')
    `, [leases[1].id, leases[1].tenant_id,
        leases[1].unit_id]);

    await query(`
      INSERT INTO transactions
        (transaction_date, type, amount,
         account, category, lease_id,
         tenant_id, unit_id,
         payment_method, description)
      VALUES
        ('2025-02-01','income',60000,
         'rent','rent',$1,$2,$3,
         'cash','Partial rent payment')
    `, [leases[2].id, leases[2].tenant_id,
        leases[2].unit_id]);

    // Utility payments
    const months = ['2025-01','2025-02','2025-03'];
    for (const month of months) {
      for (const l of leases.slice(0, 3)) {
        await query(`
          INSERT INTO transactions
            (transaction_date, type, amount,
             account, category, lease_id,
             tenant_id, unit_id,
             billing_month, payment_method,
             description)
          VALUES
            ($1,'income',500,'utility',
             'utility_water',$2,$3,$4,
             $5,'cash',$6)
        `, [
          `${month}-15`, l.id,
          l.tenant_id, l.unit_id,
          month, `Water - ${month}`
        ]);

        await query(`
          INSERT INTO transactions
            (transaction_date, type, amount,
             account, category, lease_id,
             tenant_id, unit_id,
             billing_month, payment_method,
             description)
          VALUES
            ($1,'income',300,'utility',
             'utility_garbage',$2,$3,$4,
             $5,'cash',$6)
        `, [
          `${month}-15`, l.id,
          l.tenant_id, l.unit_id,
          month, `Garbage - ${month}`
        ]);
      }
    }

    // Operational expenses
    const expenses = [
      ['2025-01-10', 8500, 'diesel',
       blockA.id, 'Generator diesel Jan'],
      ['2025-01-31', 35000, 'salaries',
       null, 'Staff salaries Jan'],
      ['2025-02-05', 5200, 'repairs',
       blockA.id, 'Plumbing repair A3'],
      ['2025-02-10', 8500, 'diesel',
       blockA.id, 'Generator diesel Feb'],
      ['2025-02-28', 35000, 'salaries',
       null, 'Staff salaries Feb'],
      ['2025-03-01', 12000, 'materials',
       blockC.id, 'Paint Block C corridor'],
      ['2025-03-10', 1500, 'transport',
       null, 'Transport to hardware'],
      ['2025-03-31', 35000, 'salaries',
       null, 'Staff salaries Mar']
    ];

    for (const [date, amount, cat,
      blockId, desc] of expenses) {
      await query(`
        INSERT INTO transactions
          (transaction_date, type, amount,
           account, category, block_id,
           payment_method, description)
        VALUES
          ($1,'expense',$2,'imprest',
           $3,$4,'cash',$5)
      `, [date, amount, cat, blockId, desc]);
    }

    console.log('✅ Transactions created');

    // ── MAINTENANCE ─────────────────────────────
    await query(`
      INSERT INTO maintenance_records
        (block_id, unit_id, title,
         description, reported_by,
         priority, status,
         reported_date, completed_date,
         work_done)
      VALUES
        ($1,$2,
         'Bathroom plumbing leak',
         'Water leak under sink in A3',
         'Peter Kamau',
         'high','completed',
         '2025-02-03','2025-02-05',
         'Replaced PVC pipe')
    `, [blockA.id, getUnit('A3').id]);

    await query(`
      INSERT INTO maintenance_records
        (block_id, title, description,
         reported_by, priority, status,
         reported_date, completed_date,
         work_done)
      VALUES
        ($1,
         'Block C corridor painting',
         'Walls faded need repainting',
         'Caretaker',
         'low','completed',
         '2025-03-01','2025-03-10',
         'Repainted with 3 coats')
    `, [blockC.id]);

    await query(`
      INSERT INTO maintenance_records
        (block_id, title, description,
         reported_by, priority, status,
         reported_date)
      VALUES
        ($1,
         'Generator servicing due',
         'Scheduled annual maintenance',
         'Manager',
         'medium','reported',
         '2025-04-01')
    `, [blockA.id]);

    console.log('✅ Maintenance records created');

    console.log('\n🎉 Seed complete!\n');
    console.log('📊 Summary:');
    console.log('   3 Blocks (A, B, C)');
    console.log('   10 Units (5 occupied, 5 vacant)');
    console.log('   5 Active Tenants with Leases');
    console.log('   Transactions across 3 months');
    console.log('   3 Maintenance Records\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await pool.end();
  }
};

seed();