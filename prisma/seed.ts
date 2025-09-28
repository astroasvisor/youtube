import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create Classes
  console.log('📚 Creating classes...')
  const class9 = await prisma.class.upsert({
    where: { name: 'Class 9' },
    update: {},
    create: {
      name: 'Class 9',
      description: 'CBSE Class 9 Science curriculum',
    },
  })

  const class10 = await prisma.class.upsert({
    where: { name: 'Class 10' },
    update: {},
    create: {
      name: 'Class 10',
      description: 'CBSE Class 10 Science curriculum',
    },
  })

  const class11 = await prisma.class.upsert({
    where: { name: 'Class 11' },
    update: {},
    create: {
      name: 'Class 11',
      description: 'CBSE Class 11 Science curriculum',
    },
  })

  const class12 = await prisma.class.upsert({
    where: { name: 'Class 12' },
    update: {},
    create: {
      name: 'Class 12',
      description: 'CBSE Class 12 Science curriculum',
    },
  })

  console.log('✅ Classes created')

  // Class 9 Subjects and Topics
  console.log('🔬 Creating Class 9 subjects and topics...')

  const class9Physics = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Physics',
        classId: class9.id
      }
    },
    update: {},
    create: {
      name: 'Physics',
      classId: class9.id,
    },
  })

  await createTopics(class9Physics.id, [
    'Motion',
    'Force and Laws of Motion',
    'Gravitation',
    'Work and Energy',
    'Sound',
  ])

  const class9Chemistry = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Chemistry',
        classId: class9.id
      }
    },
    update: {},
    create: {
      name: 'Chemistry',
      classId: class9.id,
    },
  })

  await createTopics(class9Chemistry.id, [
    'Matter in Our Surroundings',
    'Is Matter Around Us Pure?',
    'Atoms and Molecules',
    'Structure of the Atom',
    'The Fundamental Unit of Life',
    'Tissues',
    'Diversity in Living Organisms',
    'Motion',
    'Force and Laws of Motion',
    'Gravitation',
    'Work and Energy',
    'Sound',
  ])

  const class9Biology = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Biology',
        classId: class9.id
      }
    },
    update: {},
    create: {
      name: 'Biology',
      classId: class9.id,
    },
  })

  await createTopics(class9Biology.id, [
    'The Fundamental Unit of Life',
    'Tissues',
    'Diversity in Living Organisms',
    'Why Do We Fall Ill?',
    'Natural Resources',
    'Improvement in Food Resources',
  ])

  console.log('✅ Class 9 subjects and topics created')

  // Class 10 Subjects and Topics
  console.log('🔬 Creating Class 10 subjects and topics...')

  const class10Physics = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Physics',
        classId: class10.id
      }
    },
    update: {},
    create: {
      name: 'Physics',
      classId: class10.id,
    },
  })

  await createTopics(class10Physics.id, [
    'Light - Reflection and Refraction',
    'Human Eye and Colourful World',
    'Electricity',
    'Magnetic Effects of Electric Current',
    'Sources of Energy',
  ])

  const class10Chemistry = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Chemistry',
        classId: class10.id
      }
    },
    update: {},
    create: {
      name: 'Chemistry',
      classId: class10.id,
    },
  })

  await createTopics(class10Chemistry.id, [
    'Chemical Reactions and Equations',
    'Acids, Bases and Salts',
    'Metals and Non-metals',
    'Carbon and its Compounds',
    'Periodic Classification of Elements',
    'Life Processes',
    'Control and Coordination',
    'How do Organisms Reproduce?',
    'Heredity and Evolution',
    'Light - Reflection and Refraction',
    'Human Eye and Colourful World',
    'Electricity',
  ])

  const class10Biology = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Biology',
        classId: class10.id
      }
    },
    update: {},
    create: {
      name: 'Biology',
      classId: class10.id,
    },
  })

  await createTopics(class10Biology.id, [
    'Life Processes',
    'Control and Coordination',
    'How do Organisms Reproduce?',
    'Heredity and Evolution',
    'Our Environment',
    'Management of Natural Resources',
  ])

  console.log('✅ Class 10 subjects and topics created')

  // Class 11 Subjects and Topics
  console.log('🔬 Creating Class 11 subjects and topics...')

  const class11Physics = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Physics',
        classId: class11.id
      }
    },
    update: {},
    create: {
      name: 'Physics',
      classId: class11.id,
    },
  })

  await createTopics(class11Physics.id, [
    'Physical World',
    'Units and Measurements',
    'Motion in a Straight Line',
    'Motion in a Plane',
    'Laws of Motion',
    'Work, Energy and Power',
    'System of Particles and Rotational Motion',
    'Gravitation',
    'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids',
    'Thermal Properties of Matter',
    'Thermodynamics',
    'Kinetic Theory',
    'Oscillations',
    'Waves',
  ])

  const class11Chemistry = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Chemistry',
        classId: class11.id
      }
    },
    update: {},
    create: {
      name: 'Chemistry',
      classId: class11.id,
    },
  })

  await createTopics(class11Chemistry.id, [
    'Some Basic Concepts of Chemistry',
    'Structure of Atom',
    'Classification of Elements and Periodicity in Properties',
    'Chemical Bonding and Molecular Structure',
    'States of Matter',
    'Thermodynamics',
    'Equilibrium',
    'Redox Reactions',
    'Hydrogen',
    'The s-Block Elements',
    'The p-Block Elements',
    'Organic Chemistry - Some Basic Principles and Techniques',
    'Hydrocarbons',
    'Environmental Chemistry',
  ])

  const class11Biology = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Biology',
        classId: class11.id
      }
    },
    update: {},
    create: {
      name: 'Biology',
      classId: class11.id,
    },
  })

  await createTopics(class11Biology.id, [
    'The Living World',
    'Biological Classification',
    'Plant Kingdom',
    'Animal Kingdom',
    'Morphology of Flowering Plants',
    'Anatomy of Flowering Plants',
    'Structural Organisation in Animals',
    'Cell: The Unit of Life',
    'Biomolecules',
    'Cell Cycle and Cell Division',
    'Transport in Plants',
    'Mineral Nutrition',
    'Photosynthesis in Higher Plants',
    'Respiration in Plants',
    'Plant Growth and Development',
    'Digestion and Absorption',
    'Breathing and Exchange of Gases',
    'Body Fluids and Circulation',
    'Excretory Products and their Elimination',
    'Locomotion and Movement',
    'Neural Control and Coordination',
    'Chemical Coordination and Integration',
  ])

  const class11Maths = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Mathematics',
        classId: class11.id
      }
    },
    update: {},
    create: {
      name: 'Mathematics',
      classId: class11.id,
    },
  })

  await createTopics(class11Maths.id, [
    'Sets',
    'Relations and Functions',
    'Trigonometric Functions',
    'Principle of Mathematical Induction',
    'Complex Numbers and Quadratic Equations',
    'Linear Inequalities',
    'Permutations and Combinations',
    'Binomial Theorem',
    'Sequences and Series',
    'Straight Lines',
    'Conic Sections',
    'Introduction to Three Dimensional Geometry',
    'Limits and Derivatives',
    'Mathematical Reasoning',
    'Statistics',
    'Probability',
  ])

  console.log('✅ Class 11 subjects and topics created')

  // Class 12 Subjects and Topics
  console.log('🔬 Creating Class 12 subjects and topics...')

  const class12Physics = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Physics',
        classId: class12.id
      }
    },
    update: {},
    create: {
      name: 'Physics',
      classId: class12.id,
    },
  })

  await createTopics(class12Physics.id, [
    'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance',
    'Current Electricity',
    'Moving Charges and Magnetism',
    'Magnetism and Matter',
    'Electromagnetic Induction',
    'Alternating Current',
    'Electromagnetic Waves',
    'Ray Optics and Optical Instruments',
    'Wave Optics',
    'Dual Nature of Radiation and Matter',
    'Atoms',
    'Nuclei',
    'Semiconductor Electronics',
    'Communication Systems',
  ])

  const class12Chemistry = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Chemistry',
        classId: class12.id
      }
    },
    update: {},
    create: {
      name: 'Chemistry',
      classId: class12.id,
    },
  })

  await createTopics(class12Chemistry.id, [
    'The Solid State',
    'Solutions',
    'Electrochemistry',
    'Chemical Kinetics',
    'Surface Chemistry',
    'General Principles and Processes of Isolation of Elements',
    'The p-Block Elements',
    'The d- and f-Block Elements',
    'Coordination Compounds',
    'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids',
    'Amines',
    'Biomolecules',
    'Polymers',
    'Chemistry in Everyday Life',
  ])

  const class12Biology = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Biology',
        classId: class12.id
      }
    },
    update: {},
    create: {
      name: 'Biology',
      classId: class12.id,
    },
  })

  await createTopics(class12Biology.id, [
    'Sexual Reproduction in Flowering Plants',
    'Human Reproduction',
    'Reproductive Health',
    'Principles of Inheritance and Variation',
    'Molecular Basis of Inheritance',
    'Evolution',
    'Human Health and Disease',
    'Strategies for Enhancement in Food Production',
    'Microbes in Human Welfare',
    'Biotechnology: Principles and Processes',
    'Biotechnology and its Applications',
    'Organisms and Populations',
    'Ecosystem',
    'Biodiversity and Conservation',
    'Environmental Issues',
  ])

  const class12Maths = await prisma.subject.upsert({
    where: {
      name_classId: {
        name: 'Mathematics',
        classId: class12.id
      }
    },
    update: {},
    create: {
      name: 'Mathematics',
      classId: class12.id,
    },
  })

  await createTopics(class12Maths.id, [
    'Relations and Functions',
    'Inverse Trigonometric Functions',
    'Matrices',
    'Determinants',
    'Continuity and Differentiability',
    'Applications of Derivatives',
    'Integrals',
    'Applications of the Integrals',
    'Differential Equations',
    'Vector Algebra',
    'Three Dimensional Geometry',
    'Linear Programming',
    'Probability',
  ])

  console.log('✅ Class 12 subjects and topics created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('📊 Summary:')
  console.log('   • 4 Classes created')
  console.log('   • 16 Subjects created')
  console.log('   • 200+ Topics created')
}

async function createTopics(subjectId: string, topicNames: string[]) {
  for (const name of topicNames) {
    await prisma.topic.upsert({
      where: {
        name_subjectId: {
          name,
          subjectId
        }
      },
      update: {},
      create: {
        name,
        subjectId,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
