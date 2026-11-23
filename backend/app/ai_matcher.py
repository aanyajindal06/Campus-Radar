import json
import math
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from PIL import Image
import io
import difflib

from .config import settings

def extract_image_vector(image_bytes: bytes) -> List[float]:
    """
    Extracts a robust 128-dimensional perceptual feature embedding from an image
    combining HSV color moments, 3x3 spatial color distribution, and edge gradient histogram.
    Vectors are L2-normalized so dot-product equals cosine similarity.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((128, 128))
        
        grid_features = []
        w, h = img.size
        bw, bh = w // 3, h // 3
        for i in range(3):
            for j in range(3):
                box = (j * bw, i * bh, (j + 1) * bw, (i + 1) * bh)
                block = img.crop(box)
                arr = np.array(block, dtype=np.float32)
                r_mean, g_mean, b_mean = np.mean(arr, axis=(0, 1))
                r_std, g_std, b_std = np.std(arr, axis=(0, 1))
                grid_features.extend([r_mean / 255.0, g_mean / 255.0, b_mean / 255.0,
                                      r_std / 255.0, g_std / 255.0, b_std / 255.0])
        
        hsv_img = img.convert("HSV")
        hsv_arr = np.array(hsv_img, dtype=np.float32)
        h_hist, _ = np.histogram(hsv_arr[:, :, 0], bins=16, range=(0, 256), density=True)
        s_hist, _ = np.histogram(hsv_arr[:, :, 1], bins=8, range=(0, 256), density=True)
        v_hist, _ = np.histogram(hsv_arr[:, :, 2], bins=8, range=(0, 256), density=True)
        
        gray = img.convert("L")
        gray_arr = np.array(gray, dtype=np.float32)
        dx = np.diff(gray_arr, axis=1)
        dy = np.diff(gray_arr, axis=0)
        grad_mag = np.sqrt(dx[:-1, :]**2 + dy[:, :-1]**2)
        grad_hist, _ = np.histogram(grad_mag, bins=42, range=(0, 256), density=True)
        
        vector = np.concatenate([grid_features, h_hist, s_hist, v_hist, grad_hist])
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()
    except Exception as e:
        print(f"Error extracting image vector: {e}")
        return [0.0] * 128

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    sim = float(np.dot(a, b) / (norm_a * norm_b))
    return max(0.0, min(1.0, sim))

def compute_text_similarity(t1: str, t2: str) -> float:
    """
    Computes text similarity using token intersection + fuzzy sequence matching
    """
    if not t1 or not t2:
        return 0.0
    s1 = t1.lower().strip()
    s2 = t2.lower().strip()
    
    if s1 == s2:
        return 1.0
    if s1 in s2 or s2 in s1:
        len_ratio = min(len(s1), len(s2)) / max(len(s1), len(s2))
        return 0.7 + 0.3 * len_ratio

    tokens1 = set(re.findall(r"\w+", s1))
    tokens2 = set(re.findall(r"\w+", s2))
    if not tokens1 or not tokens2:
        return 0.0
    
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    jaccard = len(intersection) / len(union) if union else 0.0
    
    seq_sim = difflib.SequenceMatcher(None, s1, s2).ratio()
    
    return float(0.6 * jaccard + 0.4 * seq_sim)

def compute_attribute_similarity(item1_attrs: dict, item2_attrs: dict) -> float:
    """
    Compares structured attributes: Category, Color, Brand, Model, Weight, Material, Features
    """
    weights = {
        "category": 0.35,
        "color": 0.20,
        "brand": 0.20,
        "model": 0.10,
        "material": 0.10,
        "distinguishing_features": 0.05
    }
    
    total_weight = 0.0
    score = 0.0
    
    c1 = (item1_attrs.get("category") or "").strip().lower()
    c2 = (item2_attrs.get("category") or "").strip().lower()
    if c1 and c2:
        total_weight += weights["category"]
        if c1 == c2:
            score += weights["category"] * 1.0
        elif "other" in c1 or "other" in c2:
            score += weights["category"] * 0.5
        else:
            score += weights["category"] * 0.0
            
    col1 = (item1_attrs.get("color") or "").strip().lower()
    col2 = (item2_attrs.get("color") or "").strip().lower()
    if col1 and col2:
        total_weight += weights["color"]
        if col1 == col2 or col1 in col2 or col2 in col1:
            score += weights["color"] * 1.0
        else:
            sim = compute_text_similarity(col1, col2)
            score += weights["color"] * sim
            
    b1 = (item1_attrs.get("brand") or "").strip().lower()
    b2 = (item2_attrs.get("brand") or "").strip().lower()
    if b1 and b2:
        total_weight += weights["brand"]
        if b1 == b2 or b1 in b2 or b2 in b1:
            score += weights["brand"] * 1.0
        else:
            score += weights["brand"] * compute_text_similarity(b1, b2)
            
    m1 = (item1_attrs.get("model") or "").strip().lower()
    m2 = (item2_attrs.get("model") or "").strip().lower()
    if m1 and m2:
        total_weight += weights["model"]
        if m1 == m2 or m1 in m2 or m2 in m1:
            score += weights["model"] * 1.0
        else:
            score += weights["model"] * compute_text_similarity(m1, m2)
            
    mat1 = (item1_attrs.get("material") or "").strip().lower()
    mat2 = (item2_attrs.get("material") or "").strip().lower()
    if mat1 and mat2:
        total_weight += weights["material"]
        score += weights["material"] * compute_text_similarity(mat1, mat2)
        
    f1 = (item1_attrs.get("distinguishing_features") or "").strip().lower()
    f2 = (item2_attrs.get("distinguishing_features") or "").strip().lower()
    if f1 and f2:
        total_weight += weights["distinguishing_features"]
        score += weights["distinguishing_features"] * compute_text_similarity(f1, f2)
        
    if total_weight == 0:
        return 0.5 # Neutral fallback
    return score / total_weight

def compute_location_similarity(loc1: Optional[dict], loc2: Optional[dict]) -> float:
    """
    Computes location proximity based on ID, building, and lat/long distance
    """
    if not loc1 or not loc2:
        return 0.5  # Neutral default when location unknown
        
    if loc1.get("id") and loc2.get("id") and loc1["id"] == loc2["id"]:
        return 1.0
        
    b1 = (loc1.get("building") or "").strip().lower()
    b2 = (loc2.get("building") or "").strip().lower()
    if b1 and b2 and b1 == b2:
        return 0.9
        
    lat1, lon1 = loc1.get("latitude"), loc1.get("longitude")
    lat2, lon2 = loc2.get("latitude"), loc2.get("longitude")
    if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
        R = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist = R * c
        
        if dist < 50:
            return 0.95
        elif dist < 150:
            return 0.85
        elif dist < 400:
            return 0.70
        elif dist < 800:
            return 0.50
        else:
            return 0.30
            
    return 0.5

def compute_date_proximity(date1_str: str, date2_str: str) -> float:
    """
    Calculates date proximity score based on day difference
    """
    try:
        d1 = datetime.strptime(date1_str[:10], "%Y-%m-%d").date()
        d2 = datetime.strptime(date2_str[:10], "%Y-%m-%d").date()
        diff_days = abs((d1 - d2).days)
        
        if diff_days <= 1:
            return 1.0
        elif diff_days <= 3:
            return 0.90
        elif diff_days <= 7:
            return 0.80
        elif diff_days <= 14:
            return 0.65
        elif diff_days <= 30:
            return 0.45
        else:
            return max(0.15, 1.0 - (diff_days / 60.0))
    except Exception:
        return 0.7 # Neutral fallback if date parsing fails

def calculate_hybrid_match(lost_item: dict, found_item: dict) -> Dict[str, float]:
    """
    Comprehensive 5-pillar hybrid matching engine as specified in Section 5:
    - Image similarity: 40%
    - Description similarity: 25%
    - Structured attributes: 15%
    - Location similarity: 10%
    - Date proximity: 10%
    
    Dynamically normalizes weights if certain data (e.g. image) is missing.
    """
    v1 = lost_item.get("image_embedding")
    v2 = found_item.get("image_embedding")
    has_image = bool(v1 and v2)
    if has_image:
        if isinstance(v1, str):
            v1 = json.loads(v1)
        if isinstance(v2, str):
            v2 = json.loads(v2)
        image_score = cosine_similarity(v1, v2)
    else:
        image_score = 0.0
        
    desc1 = f"{lost_item.get('name', '')} {lost_item.get('description', '')}"
    desc2 = f"{found_item.get('name', '')} {found_item.get('description', '')}"
    desc_score = compute_text_similarity(desc1, desc2)
    
    attr_score = compute_attribute_similarity(lost_item, found_item)
    
    loc_score = compute_location_similarity(lost_item.get("location"), found_item.get("location"))
    
    date_score = compute_date_proximity(
        lost_item.get("date_event", ""),
        found_item.get("date_event", "")
    )
    
    active_weights = {
        "image": settings.WEIGHT_IMAGE if has_image else 0.0,
        "description": settings.WEIGHT_DESCRIPTION,
        "attributes": settings.WEIGHT_ATTRIBUTES,
        "location": settings.WEIGHT_LOCATION,
        "date": settings.WEIGHT_DATE
    }
    
    total_active_weight = sum(active_weights.values())
    if total_active_weight <= 0:
        total_active_weight = 1.0
        
    normalized_image = (active_weights["image"] / total_active_weight) * image_score
    normalized_desc = (active_weights["description"] / total_active_weight) * desc_score
    normalized_attr = (active_weights["attributes"] / total_active_weight) * attr_score
    normalized_loc = (active_weights["location"] / total_active_weight) * loc_score
    normalized_date = (active_weights["date"] / total_active_weight) * date_score
    
    overall = (normalized_image + normalized_desc + normalized_attr + normalized_loc + normalized_date) * 100.0
    overall = round(max(0.0, min(100.0, overall)), 1)
    
    return {
        "image_score": round(image_score * 100.0, 1),
        "description_score": round(desc_score * 100.0, 1),
        "attribute_score": round(attr_score * 100.0, 1),
        "location_score": round(loc_score * 100.0, 1),
        "date_score": round(date_score * 100.0, 1),
        "overall_similarity": overall
    }
