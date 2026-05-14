import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score


# load dataset
df = pd.read_csv('processed_resumes.csv')


# features
X = df[
    [
        'semantic_score',
        'skill_match_score'
    ]
]

# labels
y = df['label']


# split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# train model
model = LogisticRegression()

model.fit(X_train, y_train)


# predictions
y_pred = model.predict(X_test)


# accuracy
accuracy = accuracy_score(y_test, y_pred)

print("Accuracy:", accuracy)


# save model
joblib.dump(model, 'model.pkl')

print("Model saved successfully")