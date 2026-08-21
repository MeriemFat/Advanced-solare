import "dotenv/config";
import mongoose from "mongoose";
import Contractor from "./models/Contractor.js";
import Project from "./models/Project.js";

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI missing in .env");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB!");

    // 1. Create 9 Contractors
    const contractorNames = [
      "SunPower Solutions & Engineering",
      "SolarEdge Energy Systems",
      "Apex Renewable Contracting",
      "VoltTech Installation Group",
      "GreenHorizon Solar Corp",
      "EcoWatt Power Services",
      "Helios Energy Contracting",
      "Photon Grid Solutions",
      "BrightFuture Solar Builders",
    ];

    const createdContractors = [];
    for (const nom of contractorNames) {
      let contractor = await Contractor.findOne({ nom });
      if (!contractor) {
        contractor = await Contractor.create({ nom });
        console.log(`+ Contractor created: ${nom}`);
      } else {
        console.log(`= Contractor already exists: ${nom}`);
      }
      createdContractors.push(contractor);
    }

    // 2. Create 10 Separate Projects
    const projectsData = [
      {
        name: "Residential Rooftop 10kW - Villa Horizon",
        description: "Installation of 24 bifacial solar panels with Enphase micro-inverters and Tesla Powerwall backup.",
        status: "En cours",
        date: "2026-08-15",
        contractor: createdContractors[0]._id,
        comments: [
          {
            author: "Admin",
            text: "Roof structural assessment approved by city engineer.",
            date: "15/08/2026",
            replies: [
              {
                author: "Meriem",
                text: "Permit documents sent to utility company.",
                date: "16/08/2026",
              },
            ],
          },
        ],
        links: [
          { title: "AHJ Permit Portal", url: "https://permits.citygov.example.com" },
        ],
      },
      {
        name: "Commercial Solar Carport 150kW - TechPark Hub",
        description: "Solar canopy parking structure with 8 EV charging stations integrated into the commercial microgrid.",
        status: "En cours",
        date: "2026-08-10",
        contractor: createdContractors[1]._id,
        comments: [
          {
            author: "Super Admin",
            text: "Foundation concrete poured. Steel mounting frames arriving on Monday.",
            date: "12/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "CAD Blueprint Drive", url: "https://drive.google.com/example-carport-blueprint" },
        ],
      },
      {
        name: "Agricultural Agrivoltaics 500kW - GreenValley Farm",
        description: "Elevated dual-axis tracking photovoltaic system enabling crop cultivation under solar panels.",
        status: "En attente",
        date: "2026-08-20",
        contractor: createdContractors[2]._id,
        comments: [
          {
            author: "Admin",
            text: "Environmental impact study submitted. Awaiting AHJ approval.",
            date: "20/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "Environmental Study PDF", url: "https://agrivoltaics-study.example.org" },
        ],
      },
      {
        name: "Industrial Warehouse 250kW - Logistics Center North",
        description: "Flat roof ballast solar system with high-efficiency tier-1 panels and smart string inverters.",
        status: "Complété",
        date: "2026-07-28",
        contractor: createdContractors[3]._id,
        comments: [
          {
            author: "Admin",
            text: "Final grid commissioning and PTO (Permission to Operate) granted successfully!",
            date: "29/07/2026",
            replies: [
              {
                author: "Admin",
                text: "Client sign-off received. Project completed on schedule.",
                date: "30/07/2026",
              },
            ],
          },
        ],
        links: [
          { title: "Final Inspection Report", url: "https://reports.solarcloud.example.com/logistics-north" },
        ],
      },
      {
        name: "Eco-Resort Off-Grid 80kW - Mountain Lodge",
        description: "Complete off-grid hybrid system with lithium battery storage and automated backup generator.",
        status: "En cours",
        date: "2026-08-05",
        contractor: createdContractors[4]._id,
        comments: [
          {
            author: "Admin",
            text: "Battery storage racks assembled and tested under full load.",
            date: "08/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "BMS Monitoring Link", url: "https://bms.mountainlodge.example.com" },
        ],
      },
      {
        name: "Municipal School District 300kW - Oakridge Campus",
        description: "Multi-building solar energy system across 3 elementary school roofs with smart energy monitoring.",
        status: "En attente",
        date: "2026-08-18",
        contractor: createdContractors[5]._id,
        comments: [
          {
            author: "Admin",
            text: "Board of education approved the financing agreement.",
            date: "18/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "School Board Resolution", url: "https://district.example.edu/solar-initiative" },
        ],
      },
      {
        name: "Medical Clinic Emergency Backup 45kW - St. Jude Center",
        description: "Critical care rooftop solar installation with fast-transfer battery system for uninterrupted medical power.",
        status: "Complété",
        date: "2026-08-01",
        contractor: createdContractors[6]._id,
        comments: [
          {
            author: "Admin",
            text: "Medical grade emergency cutover verified at 12ms transfer time.",
            date: "02/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "Electrical Safety Certificate", url: "https://safety.example.com/cert-st-jude" },
        ],
      },
      {
        name: "Shopping Plaza Ground Mount 400kW - SunBelt Mall",
        description: "Fixed-tilt ground mount solar array on adjacent commercial parcel supplying clean energy to retail stores.",
        status: "En cours",
        date: "2026-08-12",
        contractor: createdContractors[7]._id,
        comments: [
          {
            author: "Admin",
            text: "Trenching for underground DC feeders completed.",
            date: "14/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "Plaza Energy Dashboard", url: "https://sunbelt.energydashboard.example.com" },
        ],
      },
      {
        name: "Suburban Community Solar 1MW - Pine Hills Microgrid",
        description: "Shared community solar project serving 220 local residential subscribers with net metering.",
        status: "En attente",
        date: "2026-08-19",
        contractor: createdContractors[8]._id,
        comments: [
          {
            author: "Admin",
            text: "Interconnection agreement in final review stage with utility operator.",
            date: "19/08/2026",
            replies: [],
          },
        ],
        links: [
          { title: "Community Subscriber Portal", url: "https://pinehills.solarcommunity.example.org" },
        ],
      },
      {
        name: "Sports Complex Solar Canopy 120kW - City Stadium",
        description: "Curved architectural solar canopy over grandstands providing shade and generating renewable power.",
        status: "Complété",
        date: "2026-07-20",
        contractor: createdContractors[0]._id,
        comments: [
          {
            author: "Admin",
            text: "Inauguration ceremony completed with city mayor.",
            date: "22/07/2026",
            replies: [],
          },
        ],
        links: [
          { title: "City Press Release", url: "https://citynews.example.gov/stadium-solar-canopy" },
        ],
      },
    ];

    for (const proj of projectsData) {
      const existing = await Project.findOne({ name: proj.name });
      if (!existing) {
        await Project.create(proj);
        console.log(`+ Project created: ${proj.name} (${proj.status})`);
      } else {
        console.log(`= Project already exists: ${proj.name}`);
      }
    }

    console.log("✅ Seed completed successfully with 9 contractors and 10 separate projects!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
