import joblib
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# load model
model = joblib.load('model.pkl')

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


# predictions
y_pred = model.predict(X)


print(
    classification_report(
        y,
        y_pred
    )
)

print(
    confusion_matrix(
        y,
        y_pred
    )
)