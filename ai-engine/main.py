from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Define the structure of data we expect from Node.js
class MatchRequest(BaseModel):
    user_skills: List[str]
    teams: List[dict]

@app.post("/recommend")
def recommend_teams(data: MatchRequest):
    # 1. Standardize user skills to lowercase
    user_skills_set = set(skill.lower() for skill in data.user_skills)
    
    matches = []
    
    for team in data.teams:
        # 2. Standardize team skills
        team_skills_set = set(skill.lower() for skill in team['required_skills'])
        
        # 3. Calculate intersection (common skills)
        common_skills = user_skills_set.intersection(team_skills_set)
        
        # 4. If there is a match, add to list
        if len(common_skills) > 0:
            matches.append({
                "id": team['id'],
                "name": team['name'],
                "description": team['description'],
                "matched_skills": list(common_skills),
                "score": len(common_skills) # Higher score = better match
            })
            
    # 5. Return sorted by score (best match first)
    return {"recommendations": sorted(matches, key=lambda x: x['score'], reverse=True)}

# Run command: uvicorn main:app --reload --port 8000