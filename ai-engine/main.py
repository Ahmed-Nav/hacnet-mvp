from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS so React can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    user_skills: List[str]
    teams: List[dict]

@app.post("/recommend")
def recommend_teams(data: MatchRequest):
    user_skills_set = set(skill.lower() for skill in data.user_skills)
    
    matches = []
    
    for team in data.teams:
        # Safety check: ensure required_skills exists
        team_skills = team.get('required_skills', [])
        if not team_skills:
            continue

        team_skills_set = set(skill.lower() for skill in team_skills)
        common_skills = user_skills_set.intersection(team_skills_set)
        
        if len(common_skills) > 0:
            matches.append({
                "id": team['id'],
                "name": team['name'],
                "description": team['description'],
                "required_skills": team['required_skills'], # 👈 CRITICAL FIX: Return the original skills!
                "matched_skills": list(common_skills),
                "score": len(common_skills)
            })
            
    # Return sorted by score
    return {"recommendations": sorted(matches, key=lambda x: x['score'], reverse=True)}

# Run command: uvicorn main:app --reload --port 8000