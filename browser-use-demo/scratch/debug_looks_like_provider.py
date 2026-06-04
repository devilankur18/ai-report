import re

SENTENCE_INDICATORS = ["if", "are", "you", "they", "our", "their", "should", "would", "will", "these", "useful", "advises", "always", "after", "before", "when", "why", "who", "where", "how", "what", "more", "has", "have", "had", "was", "were", "been", "is", "a", "an", "the"]

def looks_like_provider(name):
    name_clean = name.strip()
    words = name_clean.split()
    if len(words) < 1 or len(words) > 5:
        print(f"Rejected {name_clean} because len(words)={len(words)}")
        return False
        
    name_lower = name_clean.lower()
    for word in SENTENCE_INDICATORS:
        if re.search(r'\b' + re.escape(word) + r'\b', name_lower):
            print(f"Rejected {name_clean} because of sentence indicator '{word}'")
            return False
            
    provider_words = ["dr.", "dr ", "doctor", "hospital", "clinic", "care", "center", "centre", "dental", "dentist", "ortho", "cardio", "specialist", "studio", "medical", "health", "aesthetic", "skin", "lifeplus", "medanta", "regency"]
    if not any(re.search(r'\b' + re.escape(pw) + r'\b', name_lower) or name_lower.startswith("dr") for pw in provider_words):
        print(f"Rejected {name_clean} because no provider word matched")
        return False
        
    print(f"Accepted: {name_clean}")
    return True

print("Navya Lifeplus:")
looks_like_provider("Navya Lifeplus")

print("\nMedanta Hospital:")
looks_like_provider("Medanta Hospital")

print("\nRegency Hospital:")
looks_like_provider("Regency Hospital")
