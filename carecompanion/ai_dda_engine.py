import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
import joblib

# ==========================================
# 1. GENERATE SYNTHETIC CLINICAL DATA
# ==========================================
def generate_training_data(num_samples=1000):
    """
    Simulates telemetry data from patients playing the Therapy Suite.
    Features: 
      - latency_ms: Average time to react (tap a card/button)
      - error_count: How many mistakes made in the session
      - completion_sec: Total time to finish the game
      - baseline_stage: The patient's clinical tier (1=Early, 2=Middle, 3=Late)
    Target (y):
      - recommended_level: 1 (Hardest) to 4 (Easiest/Assisted)
    """
    np.random.seed(42)
    data = []
    
    for _ in range(num_samples):
        # Randomly assign a baseline dementia stage
        stage = np.random.choice([1, 2, 3]) 
        
        if stage == 1: # Early Stage (Should play Level 1 or 2)
            latency = np.random.normal(1500, 500)
            errors = np.random.randint(0, 3)
            time = np.random.normal(45, 10)
            level = 1 if (errors <= 1 and latency < 1800) else 2
            
        elif stage == 2: # Middle Stage (Should play Level 2 or 3)
            latency = np.random.normal(3500, 800)
            errors = np.random.randint(2, 6)
            time = np.random.normal(90, 20)
            level = 2 if (errors <= 3 and latency < 3500) else 3
            
        else: # Late Stage (Should play Level 3 or 4)
            latency = np.random.normal(6000, 1500)
            errors = np.random.randint(4, 10)
            time = np.random.normal(150, 40)
            level = 3 if (errors <= 6 and latency < 6000) else 4
            
        # Add some noise/outliers to make the AI work for it
        if np.random.rand() > 0.9:
            level = np.random.choice([1, 2, 3, 4])

        data.append([max(100, latency), errors, max(10, time), stage, level])
        
    cols = ['latency_ms', 'error_count', 'completion_sec', 'baseline_stage', 'recommended_level']
    return pd.DataFrame(data, columns=cols)

# ==========================================
# 2. TRAIN THE DECISION TREE
# ==========================================
def train_and_save_model():
    print("Generating synthetic clinical data...")
    df = generate_training_data(2000)
    
    X = df[['latency_ms', 'error_count', 'completion_sec', 'baseline_stage']]
    y = df['recommended_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # max_depth=4 keeps the tree simple and explainable for doctors
    clf = DecisionTreeClassifier(max_depth=4, random_state=42, criterion='entropy')
    clf.fit(X_train, y_train)
    
    accuracy = clf.score(X_test, y_test)
    print(f"Model trained successfully! Accuracy: {accuracy * 100:.2f}%\n")
    
    # Save the model to a file
    joblib.dump(clf, 'dda_model.pkl')
    
    # EXPLAINABLE AI: Print the logic rules
    print("======================================================")
    print(" 🏥 EXPLAINABLE AI LOGIC (For Doctor's Dashboard)")
    print("======================================================")
    tree_rules = export_text(clf, feature_names=list(X.columns))
    print(tree_rules)
    
    return clf

# ==========================================
# 3. PREDICTION FUNCTION (API SIMULATION)
# ==========================================
def evaluate_patient_session(latency, errors, time_sec, stage):
    """
    Takes in the live stats from the React game and returns the new difficulty.
    """
    try:
        model = joblib.load('dda_model.pkl')
    except:
        model = train_and_save_model()
        
    # Format the input exactly how the model was trained
    patient_data = pd.DataFrame(
        [[latency, errors, time_sec, stage]], 
        columns=['latency_ms', 'error_count', 'completion_sec', 'baseline_stage']
    )
    
    # Predict the new level
    new_level = model.predict(patient_data)[0]
    
    return int(new_level)

# ==========================================
# 4. RUN A TEST SIMULATION
# ==========================================
if __name__ == "__main__":
    # Train the model the first time you run the script
    train_and_save_model()
    
    print("\n======================================================")
    print(" 🎮 LIVE GAMEPLAY SIMULATION")
    print("======================================================")
    
    # Scenario: A Middle-stage patient plays a game, but struggles heavily.
    # High latency (5500ms) and many errors (7).
    recommended = evaluate_patient_session(
        latency=5500, 
        errors=7, 
        time_sec=140, 
        stage=2
    )
    
    print(f"Patient Stats: 5500ms reaction time, 7 errors, Stage 2 baseline.")
    print(f"AI Decision: Shift difficulty to Level {recommended}")
    if recommended == 4:
        print("Reasoning: Patient is experiencing high cognitive fatigue. Shifting to Assisted Mode (Level 4).")