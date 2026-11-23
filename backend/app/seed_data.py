import json
import uuid
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import User, Location, Item, ItemImage, Claim, Match, RewardLedger, QRCode, AuditLog
from .auth import get_password_hash
from .ai_matcher import extract_image_vector, calculate_hybrid_match
from .qr_service import generate_qr_for_item
from .rewards import award_points

def seed_database(db: Session):
    if db.query(User).count() > 0:
        return

    print("🌱 Seeding CampusRadar database with ABES Engineering College, Ghaziabad data...")

    users_data = [
        {
            "email": "aarav.sharma@abes.ac.in",
            "full_name": "Aarav Sharma",
            "role": "student",
            "password": "password123",
            "department": "Computer Science & Engineering",
            "student_id": "2200320100041",
            "phone": "+91 98765 43210",
            "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
            "total_points": 70,
            "badge_tier": "Silver"
        },
        {
            "email": "priya.verma@abes.ac.in",
            "full_name": "Priya Verma",
            "role": "student",
            "password": "password123",
            "department": "Information Technology",
            "student_id": "2100320130089",
            "phone": "+91 98112 34567",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "total_points": 180,
            "badge_tier": "Gold"
        },
        {
            "email": "rohan.gupta@abes.ac.in",
            "full_name": "Rohan Gupta",
            "role": "student",
            "password": "password123",
            "department": "Electronics & Communication Engg",
            "student_id": "2300320310065",
            "phone": "+91 99554 11223",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "total_points": 40,
            "badge_tier": "Bronze"
        },
        {
            "email": "vikram.security@abes.ac.in",
            "full_name": "Officer Vikram Singh",
            "role": "staff",
            "password": "password123",
            "department": "Proctorial Board & Security",
            "student_id": "ABES-STAFF-902",
            "phone": "+91 98991 00223",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "total_points": 210,
            "badge_tier": "Gold"
        },
        {
            "email": "admin.director@abes.ac.in",
            "full_name": "Dr. Rajesh Gupta",
            "role": "admin",
            "password": "password123",
            "department": "Directorate, ABES Engineering College",
            "student_id": "DIR-ABES-01",
            "phone": "+91 120 7135112",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
            "total_points": 0,
            "badge_tier": "Bronze"
        }
    ]

    created_users = {}
    for ud in users_data:
        u = User(
            email=ud["email"],
            full_name=ud["full_name"],
            role=ud["role"],
            hashed_password=get_password_hash(ud["password"]),
            department=ud["department"],
            student_id=ud["student_id"],
            phone=ud["phone"],
            avatar_url=ud["avatar_url"],
            total_points=ud["total_points"],
            badge_tier=ud["badge_tier"]
        )
        db.add(u)
        created_users[ud["email"]] = u
    db.commit()

    locations_data = [
        {
            "name": "Ramanujan Block",
            "code": "RAM-BLK",
            "building": "Ramanujan Academic Complex",
            "latitude": 28.6343,
            "longitude": 77.4462,
            "description": "Primary academic block housing state-of-the-art computer labs, tutorial rooms, and faculty chambers.",
            "floors": "Ground Floor, 1st, 2nd, 3rd, 4th Floor"
        },
        {
            "name": "Aryabhatta Block",
            "code": "ARYA-BLK",
            "building": "Aryabhatta Technology Tower",
            "latitude": 28.6346,
            "longitude": 77.4469,
            "description": "Center for Computer Science, Information Technology, AI & Data Science labs, and seminar halls.",
            "floors": "Ground to 5th Floor"
        },
        {
            "name": "Bhabha Block",
            "code": "BHABHA-BLK",
            "building": "Homi Bhabha Science & Engg Wing",
            "latitude": 28.6338,
            "longitude": 77.4475,
            "description": "Electronics & Communication and Electrical Engineering research laboratories and workshops.",
            "floors": "Ground Floor, 1st, 2nd, 3rd Floor"
        },
        {
            "name": "Kalpana Chawla Block",
            "code": "KC-BLK",
            "building": "Kalpana Chawla Block",
            "latitude": 28.6332,
            "longitude": 77.4465,
            "description": "Mechanical and Civil Engineering workshops, CAD/CAM labs, and specialized drawing halls.",
            "floors": "Ground, 1st, 2nd Floor"
        },
        {
            "name": "Business School",
            "code": "BSCHOOL",
            "building": "ABES Business School Building",
            "latitude": 28.6350,
            "longitude": 77.4460,
            "description": "Management studies, MBA lecture theaters, GD/PI rooms, and corporate auditorium.",
            "floors": "1st Floor to 4th Floor"
        },
        {
            "name": "Temple",
            "code": "TMPL",
            "building": "Campus Saraswati & Shiv Temple",
            "latitude": 28.6330,
            "longitude": 77.4455,
            "description": "Serene campus temple area near lush lawns, quiet meditation benches, and main walkway.",
            "floors": "Ground Level, Temple Lawns"
        },
        {
            "name": "Girls Hostel",
            "code": "GH",
            "building": "Kasturba & Sarojini Bhawan",
            "latitude": 28.6325,
            "longitude": 77.4460,
            "description": "Secure residential complex for female students, common reading room, and dining hall.",
            "floors": "Wings A & B (Floors 1-6)"
        },
        {
            "name": "Boys Hostel",
            "code": "BH",
            "building": "Tagore & Bose Bhawan",
            "latitude": 28.6355,
            "longitude": 77.4478,
            "description": "Senior and junior male student hostels, recreational room, gymnasium, and mess.",
            "floors": "Blocks 1, 2, 3 (Floors 1-7)"
        },
        {
            "name": "Library",
            "code": "LIB",
            "building": "Central Knowledge Resource Center",
            "latitude": 28.6340,
            "longitude": 77.4466,
            "description": "Fully automated central library with digital research section, book bank, and quiet reading zones.",
            "floors": "Ground Floor, 1st & 2nd Floor"
        },
        {
            "name": "Black Stone",
            "code": "BLK-STONE",
            "building": "Black Stone Canteen & Amphitheatre",
            "latitude": 28.6336,
            "longitude": 77.4470,
            "description": "Popular student hangout hub, open-air amphitheater, food stalls, and event congregation plaza.",
            "floors": "Open Plaza & Canteen Deck"
        },
        {
            "name": "Other",
            "code": "OTHER",
            "building": "Main Sports Ground & Campus Gates",
            "latitude": 28.6341,
            "longitude": 77.4480,
            "description": "Cricket ground, basketball court, vehicle parking stands, and main university gate premises.",
            "floors": "Campus Grounds & Parking"
        }
    ]

    created_locations = {}
    for ld in locations_data:
        loc = Location(
            name=ld["name"],
            code=ld["code"],
            building=ld["building"],
            latitude=ld["latitude"],
            longitude=ld["longitude"],
            description=ld["description"],
            floors=ld["floors"]
        )
        db.add(loc)
        created_locations[ld["name"]] = loc
    db.commit()

    def synth_vector(seed_val: float):
        np.random.seed(int(seed_val * 1000) % 2**32)
        vec = np.random.randn(128).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        return vec.tolist()

    laptop_vec = synth_vector(0.42)
    earbuds_vec = synth_vector(0.77)
    bottle_vec = synth_vector(0.19)
    wallet_vec = synth_vector(0.55)
    calc_vec = synth_vector(0.31)
    keys_vec = synth_vector(0.88)

    today = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    two_days_ago = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")
    three_days_ago = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")

    items_to_create = [
        {
            "type": "found",
            "tracking_code": "CF-2026-MCB401",
            "name": "Apple MacBook Air M2 (Starlight)",
            "category": "Electronics",
            "description": "Found on Desk 18 in Ramanujan Block 3rd floor AI lab. Laptop is Starlight gold with MagSafe charger.",
            "color": "Starlight / Gold",
            "brand": "Apple",
            "model": "MacBook Air M2 13-inch",
            "weight": "1.24 kg",
            "material": "Aluminum",
            "distinguishing_features": "Transparent hardshell protective case and dark blue keyboard skin.",
            "private_details": "Sticker of Lord Ganesha on inner right palm rest; lock screen displays emergency contact initials 'A.S.'",
            "status": "stored",
            "date_event": yesterday,
            "time_event": "16:45",
            "location": created_locations["Ramanujan Block"],
            "building_room": "Room 304, 3rd Floor Lab 3",
            "storage_location": "Chief Proctor Office Locker B-04",
            "owner": created_users["priya.verma@abes.ac.in"],
            "vector": laptop_vec,
            "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "lost",
            "tracking_code": "CF-2026-LST101",
            "name": "Apple MacBook Air M2 Starlight",
            "category": "Electronics",
            "description": "Left my laptop in Ramanujan Block while preparing for the Smart India Hackathon. Contains important course assignments and project code.",
            "color": "Starlight / Gold",
            "brand": "Apple",
            "model": "MacBook Air M2",
            "weight": "1.24 kg",
            "material": "Aluminum",
            "distinguishing_features": "Clear plastic cover, Lord Ganesha sticker on palm rest, blue silicone keyboard protector.",
            "private_details": None,
            "status": "reported",
            "date_event": yesterday,
            "time_event": "16:30",
            "location": created_locations["Ramanujan Block"],
            "building_room": "3rd Floor Coding Labs",
            "storage_location": None,
            "owner": created_users["aarav.sharma@abes.ac.in"],
            "vector": synth_vector(0.4205),
            "image_url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "found",
            "tracking_code": "CF-2026-EAR202",
            "name": "Boat Airdopes 141 ANC Wireless Earbuds",
            "category": "Electronics",
            "description": "Found left on a study desk on the 2nd Floor reading room of the Central Library. Matte black charging case.",
            "color": "Matte Black",
            "brand": "Boat",
            "model": "Airdopes 141 ANC",
            "weight": "60g",
            "material": "Polycarbonate",
            "distinguishing_features": "Includes braided Type-C charging cable inside silicone sleeve.",
            "private_details": "Case bottom has blue dot sticker with letter 'A' and minor scratch on lid hinge.",
            "status": "stored",
            "date_event": two_days_ago,
            "time_event": "19:15",
            "location": created_locations["Library"],
            "building_room": "2nd Floor Silent Reference Section",
            "storage_location": "Central Library Circulation Counter Shelf 2",
            "owner": created_users["priya.verma@abes.ac.in"],
            "vector": earbuds_vec,
            "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "lost",
            "tracking_code": "CF-2026-LST102",
            "name": "Boat Wireless Bluetooth Earbuds Black",
            "category": "Electronics",
            "description": "Misplaced my black Boat earbuds while studying for semester mid-terms in the college Library.",
            "color": "Black",
            "brand": "Boat",
            "model": "Airdopes 141",
            "weight": "60g",
            "material": "Plastic",
            "distinguishing_features": "Black color case with blue dot marker.",
            "private_details": None,
            "status": "reported",
            "date_event": two_days_ago,
            "time_event": "19:00",
            "location": created_locations["Library"],
            "building_room": "Library Reading Hall",
            "storage_location": None,
            "owner": created_users["aarav.sharma@abes.ac.in"],
            "vector": synth_vector(0.7708),
            "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "found",
            "tracking_code": "CF-2026-BOT303",
            "name": "Milton Thermosteel 1000ml Stainless Steel Water Bottle",
            "category": "Accessories",
            "description": "Found on a stone bench at the Black Stone canteen area after lunch hour. Metallic blue insulated bottle.",
            "color": "Metallic Blue",
            "brand": "Milton",
            "model": "Thermosteel 1000ml",
            "weight": "480g",
            "material": "Stainless Steel",
            "distinguishing_features": "College Tech Fest 'Generero' sticker and ISRO Chandrayaan badge.",
            "private_details": "Initial 'R.G.' etched on bottom steel base; minor dent on outer rim.",
            "status": "stored",
            "date_event": today,
            "time_event": "13:30",
            "location": created_locations["Black Stone"],
            "building_room": "Black Stone Canteen Benches",
            "storage_location": "Black Stone Security Guard Booth",
            "owner": created_users["rohan.gupta@abes.ac.in"],
            "vector": bottle_vec,
            "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "found",
            "tracking_code": "CF-2026-CLC404",
            "name": "Casio fx-991EX Classwiz Scientific Calculator",
            "category": "Electronics",
            "description": "Found on student desk in Aryabhatta Block Room 204 following Engineering Mathematics-II exam.",
            "color": "Black & White",
            "brand": "Casio",
            "model": "fx-991EX Classwiz",
            "weight": "190g",
            "material": "Plastic",
            "distinguishing_features": "Carbon-textured surface with clear slide-on cover.",
            "private_details": "Student name 'Kavita M.' and Section 'CSE-B' written with permanent marker inside cover.",
            "status": "stored",
            "date_event": three_days_ago,
            "time_event": "15:10",
            "location": created_locations["Aryabhatta Block"],
            "building_room": "Room 204, 2nd Floor",
            "storage_location": "Aryabhatta Exam Cell Cabinet 3",
            "owner": created_users["vikram.security@abes.ac.in"],
            "vector": calc_vec,
            "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "lost",
            "tracking_code": "CF-2026-WLT103",
            "name": "Fastrack Brown Leather Wallet with College ID Card",
            "category": "Wallets & Cards",
            "description": "Lost my leather wallet while walking between Boys Hostel and Black Stone. Contains ABES College ID card (2200320100041) and Metro smart card.",
            "color": "Dark Brown",
            "brand": "Fastrack",
            "model": "Bi-Fold Leather",
            "weight": "85g",
            "material": "Genuine Leather",
            "distinguishing_features": "Embossed Fastrack logo on front; student ID card visible in transparent slot.",
            "private_details": None,
            "status": "reported",
            "date_event": yesterday,
            "time_event": "18:30",
            "location": created_locations["Boys Hostel"],
            "building_room": "Path between Tagore Hostel and Black Stone",
            "storage_location": None,
            "owner": created_users["aarav.sharma@abes.ac.in"],
            "vector": wallet_vec,
            "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "found",
            "tracking_code": "CF-2026-KEY505",
            "name": "Royal Enfield Bike Key with ABES Keychain",
            "category": "Keys",
            "description": "Found on the lawn walkway near the campus Temple. Single Royal Enfield key with ABES Engineering College metallic keychain.",
            "color": "Silver / Black",
            "brand": "Royal Enfield",
            "model": "Meteor 350 Key",
            "weight": "45g",
            "material": "Metal & Leather",
            "distinguishing_features": "Includes a small brass Om symbol pendant attached to the split ring.",
            "private_details": "Key code number 'RE-8814' stamped on back side of key shank.",
            "status": "stored",
            "date_event": today,
            "time_event": "09:15",
            "location": created_locations["Temple"],
            "building_room": "Temple Garden Walkway",
            "storage_location": "Main Gate Security Post Key Locker",
            "owner": created_users["priya.verma@abes.ac.in"],
            "vector": keys_vec,
            "image_url": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80"
        },
        {
            "type": "found",
            "tracking_code": "CF-2026-BAG606",
            "name": "Wildcraft Navy Blue College Backpack with Drafter",
            "category": "Accessories",
            "description": "Left in Bhabha Block Drawing Hall after Engineering Graphics practicals. Successfully returned to B.Tech student owner.",
            "color": "Navy Blue / Orange",
            "brand": "Wildcraft",
            "model": "Cargo 35L",
            "weight": "650g",
            "material": "Nylon",
            "distinguishing_features": "Engineering drafter tube attached to side buckle.",
            "private_details": "First semester Chemistry lab notebook with name 'Rohan Gupta' inside main compartment.",
            "status": "returned",
            "date_event": three_days_ago,
            "time_event": "11:00",
            "location": created_locations["Bhabha Block"],
            "building_room": "Drawing Hall 2, 1st Floor",
            "storage_location": "Proctorial Board Security Vault",
            "owner": created_users["priya.verma@abes.ac.in"],
            "vector": synth_vector(0.12),
            "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80"
        }
    ]

    persisted_items = []
    for idata in items_to_create:
        qr_token = None
        qr_image_url = None
        if idata["type"] == "found":
            qr_token = f"tok_{uuid.uuid4().hex}"
            qr_image_url = generate_qr_for_item(idata["tracking_code"], qr_token)
            
        it = Item(
            type=idata["type"],
            tracking_code=idata["tracking_code"],
            name=idata["name"],
            category=idata["category"],
            description=idata["description"],
            color=idata["color"],
            brand=idata["brand"],
            model=idata["model"],
            weight=idata["weight"],
            material=idata["material"],
            distinguishing_features=idata["distinguishing_features"],
            private_details=idata["private_details"],
            status=idata["status"],
            date_event=idata["date_event"],
            time_event=idata["time_event"],
            location_id=idata["location"].id,
            building_room=idata["building_room"],
            storage_location=idata["storage_location"],
            owner_id=idata["owner"].id,
            qr_token=qr_token,
            qr_image_url=qr_image_url,
            image_embedding=json.dumps(idata["vector"])
        )
        db.add(it)
        db.commit()
        db.refresh(it)
        persisted_items.append(it)
        
        if qr_token:
            qr_rec = QRCode(
                item_id=it.id,
                secure_token=qr_token,
                qr_image_url=qr_image_url,
                scan_count=2 if it.status == "returned" else 0
            )
            db.add(qr_rec)
            
        img_rec = ItemImage(
            item_id=it.id,
            file_path=idata["image_url"],
            file_url=idata["image_url"],
            is_primary=True,
            embedding_json=json.dumps(idata["vector"])
        )
        db.add(img_rec)
    db.commit()

    lost_items = [i for i in persisted_items if i.type == "lost"]
    found_items = [i for i in persisted_items if i.type == "found"]

    for l_item in lost_items:
        for f_item in found_items:
            l_dict = {
                "name": l_item.name, "description": l_item.description, "category": l_item.category,
                "color": l_item.color, "brand": l_item.brand, "model": l_item.model,
                "weight": l_item.weight, "material": l_item.material,
                "distinguishing_features": l_item.distinguishing_features,
                "date_event": l_item.date_event, "image_embedding": l_item.image_embedding,
                "location": {"id": l_item.location.id, "building": l_item.location.building,
                             "latitude": l_item.location.latitude, "longitude": l_item.location.longitude}
            }
            f_dict = {
                "name": f_item.name, "description": f_item.description, "category": f_item.category,
                "color": f_item.color, "brand": f_item.brand, "model": f_item.model,
                "weight": f_item.weight, "material": f_item.material,
                "distinguishing_features": f_item.distinguishing_features,
                "date_event": f_item.date_event, "image_embedding": f_item.image_embedding,
                "location": {"id": f_item.location.id, "building": f_item.location.building,
                             "latitude": f_item.location.latitude, "longitude": f_item.location.longitude}
            }
            breakdown = calculate_hybrid_match(l_dict, f_dict)
            if breakdown["overall_similarity"] >= 50.0:
                m = Match(
                    lost_item_id=l_item.id,
                    found_item_id=f_item.id,
                    overall_similarity=breakdown["overall_similarity"],
                    image_score=breakdown["image_score"],
                    description_score=breakdown["description_score"],
                    attribute_score=breakdown["attribute_score"],
                    location_score=breakdown["location_score"],
                    date_score=breakdown["date_score"],
                    status="suggested"
                )
                db.add(m)
    db.commit()

    found_macbook = next(i for i in persisted_items if i.tracking_code == "CF-2026-MCB401")
    aarav_user = created_users["aarav.sharma@abes.ac.in"]
    vikram_staff = created_users["vikram.security@abes.ac.in"]

    claim1 = Claim(
        item_id=found_macbook.id,
        claimant_id=aarav_user.id,
        proof_description="I can unlock it using Touch ID or password. The emergency lock screen note says 'Aarav Sharma - ABES EC CSE Dept'. There is an embossed Lord Ganesha sticker on the inner palm rest.",
        status="pending"
    )
    db.add(claim1)
    
    returned_bag = next(i for i in persisted_items if i.tracking_code == "CF-2026-BAG606")
    claim2 = Claim(
        item_id=returned_bag.id,
        claimant_id=created_users["rohan.gupta@abes.ac.in"].id,
        proof_description="Left my Wildcraft college bag in Bhabha Drawing Hall. Engineering drafter is in the side pocket and my Chemistry notebook has my name Rohan Gupta.",
        status="returned",
        staff_notes="Verified ABES college ID card and student name inside notebook. Handed over successfully.",
        reviewed_by_id=vikram_staff.id,
        reviewed_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(claim2)

    ledger_entries = [
        RewardLedger(
            user_id=created_users["priya.verma@abes.ac.in"].id,
            points=10,
            reason="report_found",
            description="Reported found item 'Apple MacBook Air M2 (Starlight)'",
            reference_id="CF-2026-MCB401",
            created_at=datetime.utcnow() - timedelta(days=1)
        ),
        RewardLedger(
            user_id=created_users["priya.verma@abes.ac.in"].id,
            points=50,
            reason="item_returned",
            description="Successfully returned item 'Wildcraft Navy Blue College Backpack'",
            reference_id="RETURN_CF-2026-BAG606",
            created_at=datetime.utcnow() - timedelta(days=1)
        ),
        RewardLedger(
            user_id=created_users["rohan.gupta@abes.ac.in"].id,
            points=10,
            reason="report_found",
            description="Reported found item 'Milton Thermosteel 1000ml Bottle'",
            reference_id="CF-2026-BOT303",
            created_at=datetime.utcnow()
        )
    ]
    for le in ledger_entries:
        db.add(le)

    db.add(AuditLog(
        user_id=vikram_staff.id,
        action="VERIFY_RETURN",
        details="Security Officer Vikram Singh verified and confirmed return of Wildcraft Backpack (CF-2026-BAG606) to student Rohan Gupta (ECE)",
        ip_address="192.168.10.45"
    ))

    db.commit()
    print("✅ CampusRadar database successfully seeded with ABES Engineering College, Ghaziabad data!")
