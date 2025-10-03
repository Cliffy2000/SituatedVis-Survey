import pandas as pd
import os

for file in os.listdir():
    if file.endswith('.csv') and file.startswith('Set'):
        df = pd.read_csv(file)
        df.rename(columns={'rand': 'value'}, inplace=True)
        df.to_csv(file, index=False)