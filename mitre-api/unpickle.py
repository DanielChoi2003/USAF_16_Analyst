import pickle
import pprint
import sys

def convert_pkl_to_txt(input_file, output_file):
    """
    Loads a pickle file and saves its contents as human-readable
    text in an output file.
    """
    try:
        # Open the pickle file in binary read mode ('rb')
        with open(input_file, 'rb') as f_in:
            # Load the data from the pickle file
            data = pickle.load(f_in)

        # Format the loaded data using pprint for readability
        # indent=4 adds nice indentation
        formatted_data = pprint.pformat(data, indent=4, width=100)

        # Open the output text file in write mode ('w')
        with open(output_file, 'w', encoding='utf-8') as f_out:
            f_out.write(formatted_data)
        
        print(f"✅ Successfully converted '{input_file}' to '{output_file}'")

    except FileNotFoundError:
        print(f"❌ Error: The file '{input_file}' was not found.")
    except pickle.UnpicklingError:
        print(f"❌ Error: Could not unpickle '{input_file}'.")
        print("   The file may be corrupt or not a valid pickle file.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Check if the user provided the two required arguments
    if len(sys.argv) != 3:
        print("Usage: python unpickle.py <input_file.pkl> <output_file.txt>")
        sys.exit(1) # Exit the script with an error code

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    convert_pkl_to_txt(input_path, output_path)