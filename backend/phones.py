"""Samsung Galaxy catalog — broad 2024-2026 range."""

import re

PHONES = [
    # ---- 2026 flagships ----
    {
        "id": "s26-ultra",
        "name": "Galaxy S26 Ultra",
        "series": "S",
        "year": 2026,
        "price_inr": 139999,
        "match_tags": ["camera", "performance", "display", "creator", "professional", "gamer", "tech_enthusiast", "business_executive", "s_pen"],
        "image": "/phones/s26-ultra.jpg",
        "colors": ["#1A1A1A", "#E8E8E8", "#B8A98A", "#324E9C"],
        "specs": {"battery": "5200 mAh", "processor": "Snapdragon 8 Elite Gen 5", "camera": "200 MP", "display": "6.9\" QHD+ AMOLED"},
        "features": ["200MP Pro Camera", "Snapdragon 8 Elite Gen 5", "S-Pen Included", "Titanium Frame", "AI Photo Editor"],
        "story": "Our absolute flagship — pro-grade cameras, blistering AI performance, all-day battery.",
    },
    {
        "id": "s26-plus",
        "name": "Galaxy S26+",
        "series": "S",
        "year": 2026,
        "price_inr": 99999,
        "match_tags": ["performance", "display", "gamer", "creator", "tech_enthusiast", "professional"],
        "image": "/phones/s26-plus.jpg",
        "colors": ["#111827", "#F5F5F0", "#2563EB"],
        "specs": {"battery": "4900 mAh", "processor": "Snapdragon 8 Elite Gen 5", "camera": "50 MP", "display": "6.7\" QHD+ AMOLED"},
        "features": ["Big 6.7\" Display", "Flagship Chipset", "Fast 45W Charging", "IP68 Water Resistant"],
        "story": "Big, beautiful, and fast — for people who want flagship power without the Ultra price.",
    },
    {
        "id": "s26",
        "name": "Galaxy S26",
        "series": "S",
        "year": 2026,
        "price_inr": 74999,
        "match_tags": ["performance", "camera", "professional", "tech_enthusiast", "creator"],
        "image": "/phones/s26.jpg",
        "colors": ["#111", "#EEE", "#7F9CF5"],
        "specs": {"battery": "4000 mAh", "processor": "Snapdragon 8 Elite Gen 5", "camera": "50 MP", "display": "6.2\" AMOLED"},
        "features": ["Compact Flagship", "Snapdragon 8 Elite", "50MP Camera", "AMOLED 120Hz"],
        "story": "All the flagship power in a compact, one-hand form factor.",
    },
    # ---- Foldables ----
    {
        "id": "z-fold-7",
        "name": "Galaxy Z Fold 7",
        "series": "Fold",
        "year": 2025,  # announced 9 Jul 2025, on sale 25 Jul 2025
        "price_inr": 174999,
        "match_tags": ["business_executive", "professional", "creator", "tech_enthusiast", "entertainment", "display", "s_pen", "foldable"],
        "image": "/phones/z-fold-7.jpg",
        "colors": ["#0A0A0A", "#DBDBDB", "#354F52"],
        "specs": {"battery": "4600 mAh", "processor": "Snapdragon 8 Elite Gen 5", "camera": "50 MP", "display": "8.0\" Foldable AMOLED"},
        "features": ["8-inch Foldable Screen", "Multi-tasking Powerhouse", "S-Pen Compatible", "Ultra-thin Design"],
        "story": "A tablet in your pocket — fold open for meetings, movies, and multitasking.",
    },
    {
        "id": "z-flip-7",
        "name": "Galaxy Z Flip 7",
        "series": "Flip",
        "year": 2025,  # launched alongside the Z Fold 7 on 9 Jul 2025
        "price_inr": 109999,
        "match_tags": ["creator", "traveller", "student", "camera", "entertainment", "tech_enthusiast", "foldable"],
        "image": "/phones/z-flip-7.jpg",
        "colors": ["#EAB308", "#0EA5E9", "#111"],
        "specs": {"battery": "4000 mAh", "processor": "Snapdragon 8 Elite Gen 5", "camera": "50 MP", "display": "6.7\" Foldable"},
        "features": ["Pocketable Flip Design", "FlexCam Selfies", "Cover Screen Widgets", "Stylish + Compact"],
        "story": "Fashion meets flagship — flip to shoot, flip to close, always eye-catching.",
    },
    # ---- 2025 ----
    {
        "id": "s25-ultra",
        "name": "Galaxy S25 Ultra",
        "series": "S",
        "year": 2025,
        "price_inr": 129999,
        "match_tags": ["camera", "performance", "creator", "professional", "gamer", "tech_enthusiast", "s_pen"],
        "image": "/phones/s25-ultra.jpg",
        "colors": ["#1F2937", "#F3F4F6", "#7C3AED"],
        "specs": {"battery": "5000 mAh", "processor": "Snapdragon 8 Elite", "camera": "200 MP", "display": "6.8\" QHD+"},
        "features": ["200MP Camera", "S-Pen", "Titanium Frame", "Galaxy AI"],
        "story": "Last year's flagship, still a beast for photography and productivity.",
    },
    {
        "id": "s25",
        "name": "Galaxy S25",
        "series": "S",
        "year": 2025,
        "price_inr": 69999,
        "match_tags": ["performance", "camera", "professional", "student", "tech_enthusiast"],
        "image": "/phones/s25.jpg",
        "colors": ["#111", "#F5F5F5", "#EF4444"],
        "specs": {"battery": "4000 mAh", "processor": "Snapdragon 8 Elite", "camera": "50 MP", "display": "6.2\" AMOLED"},
        "features": ["Flagship-grade Camera", "Galaxy AI", "Compact Size", "120Hz Display"],
        "story": "Compact flagship that punches above its weight.",
    },
    # ---- A-series (mid-range) ----
    {
        "id": "a56",
        "name": "Galaxy A56 5G",
        "series": "A",
        "year": 2025,
        "price_inr": 34999,  # 8/128 on samsung.com/in (MRP 49,999)
        "match_tags": ["student", "budget", "camera", "family", "traveller", "durability", "display"],
        "image": "/phones/a56.jpg",
        "colors": ["#7C8B6B", "#3A3A3C", "#E7C6C9", "#D8D8D8"],  # Olive, Graphite, Pink, Lightgray
        "specs": {"battery": "5000 mAh", "processor": "Exynos 1580", "camera": "50 MP", "display": "6.7\" FHD+ AMOLED"},
        "features": ["50MP OIS camera", "45W fast charging", "Gorilla Glass Victus+", "6 years of OS updates"],
        "story": "Sweet spot for students and everyday users — flagship feel at mid-range price.",
    },
    {
        "id": "a35",
        "name": "Galaxy A35 5G",
        "series": "A",
        "year": 2024,
        "price_inr": 24999,
        "match_tags": ["student", "budget", "family", "traveller", "durability"],
        "image": "/phones/a35.jpg",
        "colors": ["#6366F1", "#111", "#EAB308"],
        "specs": {"battery": "5000 mAh", "processor": "Exynos 1380", "camera": "50 MP", "display": "6.6\" Super AMOLED"},
        "features": ["All-day battery", "Gorilla Glass Victus+", "50MP main camera", "5G ready"],
        "story": "Rock-solid daily driver with premium build for a budget-friendly price.",
    },
    # ---- M-series (battery beasts) ----
    {
        "id": "m56",
        "name": "Galaxy M56 5G",
        "series": "M",
        "year": 2025,
        "price_inr": 27999,  # 8/128 on samsung.com/in (MRP 33,999)
        "match_tags": ["budget", "battery", "entertainment", "gamer", "student", "family"],
        "image": "/phones/m56.jpg",
        "colors": ["#111111", "#BFD8B8", "#7C6BAF"],  # Black, Light Green, Violet
        "specs": {"battery": "5000 mAh", "processor": "Exynos 1480", "camera": "50 MP", "display": "6.7\" FHD+ AMOLED"},
        "features": ["7.2mm slim design", "5000 mAh + 45W charging", "Gorilla Glass Victus+", "6 years of OS updates"],
        "story": "Slimmest M-series yet — big battery and a vivid 120Hz screen for streaming on the go.",
    },
    {
        "id": "m35",
        "name": "Galaxy M35 5G",
        "series": "M",
        "year": 2024,
        "price_inr": 17999,
        "match_tags": ["budget", "battery", "family", "student", "entertainment"],
        "image": "/phones/m35.jpg",
        "colors": ["#0EA5E9", "#111", "#A855F7"],
        "specs": {"battery": "6000 mAh", "processor": "Exynos 1380", "camera": "50 MP", "display": "6.6\" Super AMOLED"},
        "features": ["6000 mAh battery", "Two-day usage", "50MP camera", "vApnFast charging"],
        "story": "The ultimate budget battery beast — two days of usage on a single charge.",
    },
    # ---- S24 (last-gen) ----
    {
        "id": "s24-fe",
        "name": "Galaxy S24 FE",
        "series": "S",
        "year": 2024,
        "price_inr": 32999,
        "match_tags": ["student", "budget", "camera", "performance", "creator"],
        "image": "/phones/s24-fe.jpg",
        "colors": ["#1F2937", "#DBEAFE", "#22C55E", "#F59E0B"],
        "specs": {"battery": "4700 mAh", "processor": "Exynos 2400e", "camera": "50 MP", "display": "6.7\" FHD+"},
        "features": ["All-day battery", "Great performance", "Excellent camera", "Super AMOLED display"],
        "story": "Fan Edition — flagship features at a friendlier price.",
    },
]

# Preferences the user states as facts about the hardware, not as leanings. Picking
# "S-Pen support" means the phone must have one — scoring these additively would let a
# phone without an S-Pen still win on other tags, which is what the wizard used to do.
HARD_PREFERENCE_TAGS = {"s_pen", "foldable", "compact", "large_screen", "5g", "latest"}

_DISPLAY_INCHES = re.compile(r'([\d.]+)"')
_LATEST_YEAR = max(p["year"] for p in PHONES)


def _derived_tags(phone: dict) -> set:
    """Tags implied by spec data the catalog already carries.

    Derived rather than hand-written so a new or re-specced phone can't drift out of
    sync with its own tags — the failure that left every preference chip inert.
    """
    tags = {"5g"}  # every device in this catalog is 5G
    if phone["year"] == _LATEST_YEAR:
        tags.add("latest")
    inches = _DISPLAY_INCHES.search(phone["specs"]["display"])
    if inches:
        size = float(inches.group(1))
        if size < 6.4:
            tags.add("compact")
        elif size >= 6.7:
            tags.add("large_screen")
    return tags


for _phone in PHONES:
    _phone["match_tags"] = sorted(set(_phone["match_tags"]) | _derived_tags(_phone))


def catalog_vocabulary() -> set:
    """Every tag any phone can match. The contract test checks UI ids against this."""
    return {tag for phone in PHONES for tag in phone["match_tags"]}


def satisfies(phone: dict, preferences: list) -> bool:
    """True if the phone has every hard preference asked for."""
    return all(
        pref in phone["match_tags"]
        for pref in preferences
        if pref in HARD_PREFERENCE_TAGS
    )


def match_score(phone: dict, tags: list, budget: int | None) -> int:
    """Return match score 0-100."""
    tag_hits = sum(1 for t in tags if t in phone["match_tags"])
    tag_score = min(60, tag_hits * 12) if tags else 40
    if budget:
        if phone["price_inr"] <= budget:
            price_score = 40
        elif phone["price_inr"] <= budget * 1.2:
            price_score = 25
        else:
            price_score = 5
    else:
        price_score = 30
    return min(99, tag_score + price_score)
