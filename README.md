# Resume Screener

This backend screens applicant resumes against a job description and returns the best matches.

## Run the API

```bash
uvicorn app:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

## Screen Resumes

Send a `POST` request to `/screen`.

```json
{
  "job_description": "Looking for a Machine Learning Engineer with Python, Docker, AWS, Terraform and Kubernetes.",
  "top_n": 10,
  "required_skills": ["python", "docker", "aws", "terraform", "kubernetes"],
  "resumes": [
    {
      "name": "Candidate One",
      "email": "candidate@example.com",
      "phone": "03001234567",
      "text": "Machine Learning Engineer with Python, AWS, Docker, Kubernetes and Terraform experience."
    },
    {
      "name": "Candidate Two",
      "text": "Frontend developer with React, CSS and HTML experience."
    }
  ]
}
```

`top_n` controls how many ranked candidates are returned. Use `10`, `20`, or any number up to the total resumes submitted.

If `required_skills` is not provided, the API tries to extract common skills from the job description.
