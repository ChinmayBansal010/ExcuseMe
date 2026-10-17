# Calibrating the ExcuseMoi excuse-likelihood score

The default zero-shot score is **not a calibrated probability**. Calibration requires human-labelled examples; do not call the score a probability until a calibrator has been trained and evaluated on representative held-out data.

## 1. Prepare labelled examples

Create a CSV such as `excuse_labels.csv` with these columns:

```csv
text,label
"I missed class because my bus broke down.",1
"The meeting starts at 3 PM.",0
"I could not submit the report because my laptop crashed.",1
"What time does the library close?",0
```

Use `1` for text that functions as an excuse/justification and `0` for text that does not. Label the text's function, not whether the reason is true. Include diverse examples, borderline cases, different writing styles, and non-excuse text. Aim for hundreds or preferably thousands of labelled examples; the script refuses fewer than 40 because tiny datasets are especially unreliable.

## 2. Fit and evaluate

From the backend directory, with backend dependencies and the configured models installed:

```bash
python -m scripts.calibrate_excuse --csv path/to/excuse_labels.csv
```

Optional column names:

```bash
python -m scripts.calibrate_excuse --csv path/to/data.csv --text-column text --label-column label
```

The script reserves a stratified test split, fits isotonic regression only on the training split, and reports Brier score, log loss, expected calibration error, and ROC AUC on held-out examples. Lower Brier/log loss/ECE is generally better; ROC AUC measures ranking, not calibration. The fitted model is saved to `backend/data/excuse_probability_calibrator.joblib`, with metrics alongside it. Keep the labelled data private if it contains personal information.

## 3. Deploy

Deploy the backend with the generated calibrator file present at that path. The API returns `calibrated: true` only when it successfully loads the fitted calibrator. Without that file, it continues to show the raw score and explicitly labels it uncalibrated. Refit and re-evaluate when the model, labels, or real-world text distribution changes.

**Important:** calibration estimates how often texts are labelled as excuses, not whether the underlying excuse is honest, true, or deceptive. Do not interpret it as a lie detector.
