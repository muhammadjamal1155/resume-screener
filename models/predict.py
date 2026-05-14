import joblib
import pandas as pd
import numpy as np

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity



# Load processed resume dataset


df = pd.read_csv('processed_resumes.csv')



# Load trained Logistic Regression model


model = joblib.load('model.pkl')



# Load transformer model for semantic embeddings


embedding_model = SentenceTransformer(
    'all-MiniLM-L6-v2'
)



# Sample Job Description
# Recruiter will provide this input


job_description = """

Looking for Machine Learning Engineer
with Python, Docker, AWS,
Terraform, Kubernetes skills.
""" 




# Convert Job Description into embedding vector


jd_embedding = embedding_model.encode(
    [job_description]
)


# Generate embeddings for all resumes


resume_embeddings = np.load(
    'resume_embeddings.npy'
)


# Calculate semantic similarity between
# job description and resumes


scores = cosine_similarity(
    jd_embedding,
    resume_embeddings
)


df['semantic_score'] = (
    (scores[0] + 1) / 2
)



# Required skills extracted from Job Description


required_skills = [
    'python',
    'docker',
    'aws',
    'terraform',
    'kubernetes'
]



# Function to calculate skill overlap score


def calculate_skill_match(candidate_skills):

    # convert skills to lowercase
    candidate_skills = str(
        candidate_skills
    ).lower()

    matched = 0

    # check how many required skills exist
    for skill in required_skills:

        if skill.lower() in candidate_skills:
            matched += 1

    # return normalized skill score
    return matched / len(required_skills)



# Apply skill matching on all resumes


df['skill_match_score'] = df[
    'Skills'
].apply(calculate_skill_match)



# Create feature matrix for ML model


X = df[
    [
        'semantic_score',
        'skill_match_score'
    ]
]



# Predict candidate class
# 1 = good match
# 0 = weak match


df['ml_prediction'] = model.predict(X)



# Predict probability of good candidate match


df['ml_probability'] = (
    model.predict_proba(X)[:, 1] * 100
).round(2)



# Final hybrid ranking score
# Combines:
# semantic relevance
# skill overlap
# ML probability


df['final_score'] = (

    df['semantic_score'] * 0.4 +

    df['skill_match_score'] * 0.2 +

    (df['ml_probability'] / 100) * 0.4
)



# Convert final score into percentage


df['final_percentage'] = (
    df['final_score'] * 100
).round(2)



# Sort candidates from best to worst


top_candidates = df.sort_values(
    by='final_percentage',
    ascending=False
)



# Display top ranked candidates


print(

    top_candidates[
        [
            'Name',
            'Category',
            'semantic_score',
            'skill_match_score',
            'ml_probability',
            'final_percentage'
        ]
    ].head(10)

)