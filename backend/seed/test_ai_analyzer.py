from backend.app.services.ai_leave_analyzer import analyze_leave


def main():
    result = analyze_leave(
        reason=(
            "I have been unwell with fever and require "
            "medical rest and treatment."
        ),
        leave_type_name="Medical Leave",
        number_of_days=3,
        attendance_before=84.5,
        projected_attendance=81.5,
    )

    print("AI ANALYSIS RESULT")
    print("------------------")
    print(f"Reason category: {result.reason_category}")
    print(f"Urgency score: {result.urgency_score}")
    print(f"Risk score: {result.risk_score}")
    print(f"Attendance risk: {result.attendance_risk}")
    print(f"Policy compliance: {result.policy_compliance}")
    print(f"Recommendation: {result.recommendation}")
    print(f"Confidence: {result.confidence}")
    print(f"Explanation: {result.explanation}")


if __name__ == "__main__":
    main()