import csv

for set_num in range(1, 7):
    for machine_num in range(1, 10):
        filename = f"Set{set_num}Machine{machine_num}.csv"
        value = set_num * 10 + machine_num
        
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['index', 'value'])
            for index in range(1, 301):
                writer.writerow([index, value])