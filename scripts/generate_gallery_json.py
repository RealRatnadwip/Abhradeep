import json
import random
import os
from datetime import datetime, timedelta

# Define constants for generation
CATEGORIES = ["Landscape", "Portrait", "Street", "Still Life", "Nature", "Travel"]

TITLES = {
    "Landscape": [
        "Silent Ridges", "Golden Canopy", "Ethereal Mist", "Sands of Time", "Restless Tide",
        "Over the Horizon", "Winter Whispers", "Autumn Slumber", "First Light", "Solitude"
    ],
    "Portrait": [
        "Quiet Contemplation", "Worn Hands", "Generations", "Unspoken Words", "The Storyteller",
        "Lost in Thought", "Innocence", "Grit and Grace", "Subtle Smile", "Reflections"
    ],
    "Street": [
        "Rainy Reflections", "Hustle and Flow", "Neon Mirage", "Corner Cafe", "Waiting for the Train",
        "Chasing Shadows", "Urban Solitude", "Midday Rush", "Crosswalk Symphony", "Nocturnal Walk"
    ],
    "Still Life": [
        "Afternoon Light", "Dried Lavender", "Morning Brew", "Forgotten Letters", "Rustic Corner",
        "Sunlit Pewter", "Faded Velvet", "Apple Harvest", "Warm Ceramics", "Dust and Shadows"
    ],
    "Nature": [
        "Morning Dew", "Forest Whispers", "Wild Iris", "Web of Light", "Dandelion Flight",
        "Lichen and Stone", "Hidden Stream", "Nesting Season", "Mossy Path", "Sunbeams"
    ],
    "Travel": [
        "Venetian Twilight", "Cobblestones of Kyoto", "Andean Heights", "Bazaar Colors", "Highland Mist",
        "Sailing into Sun", "Desert Oasis", "Steps of Rome", "Old Town Gate", "Island Breeze"
    ]
}

DESCRIPTIONS = {
    "Landscape": [
        "Taken at sunrise. The air was freezing, but the warmth of the sun breaking through the peaks made it worth the wait.",
        "The fog rolled over the valley like a slow-moving river. I stood there for an hour, watching the world disappear.",
        "There is a quiet power in the coast. The waves crashed rhythmically, washing away everything but the sand.",
        "Captured during a long trek. The vastness of the space reminded me of how small our everyday worries are.",
        "A fleeting moment where the sky caught fire. Just five minutes later, it was a dull, uniform grey."
    ],
    "Portrait": [
        "We didn't talk much. Her eyes carried a lifetime of stories, and I hoped to capture just a fraction of that depth.",
        "A candid moment captured while he was talking about his childhood garden. His face lit up in a beautiful way.",
        "The light coming through the window highlighted the texture of his skin, carved by years of working outdoors.",
        "A quiet portrait of my neighbor. There is a gentle strength in her stance that I have always admired.",
        "Caught between thoughts. Sometimes the best portraits are the ones where the subject forgets the camera is there."
    ],
    "Street": [
        "The rain started suddenly. I ducked under an awning and saw the neon signs painting the wet asphalt in neon pinks.",
        "A brief connection in a crowd of thousands. Two people sharing a laugh while the city rushed by.",
        "The architectural shadows created a perfect geometric frame. I waited until someone stepped into the light.",
        "Late evening in the city. The storefronts shine like beacons, welcoming the night-walkers and dreamers.",
        "Captured from a subway window. The motion blur of the passing station contrasts with the stillness of the rider."
    ],
    "Still Life": [
        "An arrangement of objects found around the old kitchen. It felt like a portrait of a day long gone.",
        "The simple beauty of morning light hitting a handmade ceramic mug. A daily ritual made art.",
        "These letters have sat in the drawer for fifty years. Reading them felt like stepping into another era.",
        "Wildflowers dried in a book, now resting on a worn wooden table. A preservation of passing seasons.",
        "Shadow play on the bedroom wall. The leaves of the monstera plant casting dynamic silhouettes in the afternoon."
    ],
    "Nature": [
        "Dewdrops caught on a spider's web, looking like a string of glass pearls in the early morning light.",
        "Looking closely at the bark of an ancient oak. An entire ecosystem living in the ridges of the wood.",
        "A macro shot of a dandelion ready to scatter. A symbol of resilience and quiet journeys.",
        "Light filtering through the canopy, creating patches of bright green on the damp moss below.",
        "A small, hidden wildflower growing out of a crack in a granite boulder. Life finding a way."
    ],
    "Travel": [
        "Getting lost in the narrow alleyways was the best part of the trip. Every turn revealed another postcard view.",
        "The sun setting behind the ancient pagodas, painting the sky in deep shades of indigo and amber.",
        "Market day is a sensory overload. The smell of spices, the calling of vendors, the vivid colors of textiles.",
        "A peaceful harbor where fishing boats rock gently on the tide, waiting for the early morning departure.",
        "Standing at the high pass, looking down at the winding road we had traveled to get here."
    ]
}

TAGS = {
    "Landscape": ["outdoor", "sky", "horizon", "mountains", "serene", "dawn", "dusk", "fog"],
    "Portrait": ["human", "candid", "bw", "expression", "window-light", "indoor", "character"],
    "Street": ["urban", "rain", "shadow", "candid", "night", "motion", "architecture", "reflection"],
    "Still Life": ["minimalist", "home", "vintage", "textures", "light-play", "ceramics", "wood"],
    "Nature": ["macro", "detail", "green", "morning", "wildlife", "flora", "moss", "seasons"],
    "Travel": ["architecture", "culture", "color", "historic", "journey", "boats", "street-food"]
}

ASPECT_RATIOS = ["portrait", "landscape", "square"]

def generate_mock_data(count=4000):
    data = []
    start_date = datetime(2020, 1, 1)
    
    for i in range(1, count + 1):
        # Choose a random category
        category = random.choice(CATEGORIES)
        
        # Pick title, description, aspect ratio
        title = random.choice(TITLES[category]) + f" #{i}"
        description = random.choice(DESCRIPTIONS[category])
        aspect = random.choice(ASPECT_RATIOS)
        
        # Generate random date
        days_delta = random.randint(0, (datetime.now() - start_date).days)
        item_date = (start_date + timedelta(days=days_delta)).strftime("%Y-%m-%d")
        
        # Select 2 to 4 unique tags for the category
        tags_pool = TAGS[category]
        item_tags = random.sample(tags_pool, k=random.randint(2, min(4, len(tags_pool))))
        # Always add the category tag
        item_tags.append(category.lower())
        
        filename = f"images/img_{i}.jpg"
        
        entry = {
            "id": i,
            "filename": filename,
            "title": title,
            "description": description,
            "category": category,
            "date": item_date,
            "tags": list(set(item_tags)),
            "aspectRatio": aspect
        }
        data.append(entry)
        
    # Sort data by date descending (standard portfolio behavior)
    data.sort(key=lambda x: x["date"], reverse=True)
    return data

def main():
    # Resolve absolute paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    
    data_dir = os.path.join(project_root, "data")
    images_dir = os.path.join(project_root, "images")
    
    # Ensure directories exist
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    
    print("Generating mock data for 4050 images...")
    mock_data = generate_mock_data(4050)
    
    output_path = os.path.join(data_dir, "gallery.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mock_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated {len(mock_data)} items at {output_path}")

if __name__ == "__main__":
    main()
