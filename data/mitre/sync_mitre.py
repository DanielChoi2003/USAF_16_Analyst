"""
MITRE ATT&CK Data Synchronization Service

This module fetches the latest MITRE ATT&CK techniques, tactics, and relationships
from the official TAXII server and caches them locally for fast retrieval.

Usage:
    python sync_mitre.py --update    # Fetch latest data from TAXII server
    python sync_mitre.py --load      # Load cached data from pickle files
    python sync_mitre.py --to-json   # Export cached data to JSON format

Author: Ethan Curb (refactored from original mitre.py)
Last Updated: 2025-10-11
"""

import sys
import pickle
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple
from taxii2client import Server

# Configuration
TAXII_URL = "https://attack-taxii.mitre.org/taxii2/"
DATA_DIR = Path(__file__).parent
TACTICS_PATH = DATA_DIR / "tactics.pkl"
TECHNIQUES_PATH = DATA_DIR / "techniques.pkl"
RELATIONSHIPS_PATH = DATA_DIR / "relationships.pkl"


class MITRESync:
    """Synchronize and manage MITRE ATT&CK data from TAXII server."""

    def __init__(self, taxii_url: str = TAXII_URL):
        """
        Initialize MITRE sync client.
        
        Args:
            taxii_url: URL of the MITRE ATT&CK TAXII server
        """
        self.taxii_url = taxii_url
        self.server = None

    def fetch_from_taxii(self) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Fetch tactics, techniques, and relationships from TAXII server.
        
        Returns:
            Tuple of (tactics, techniques, relationships) as lists of dictionaries
            
        Raises:
            SystemExit: If unable to connect to TAXII server or no API roots found
        """
        print(f"🔗 Connecting to TAXII server: {self.taxii_url}")
        
        try:
            self.server = Server(self.taxii_url, verify=True)
            api_roots = self.server.api_roots
        except Exception as e:
            print(f"❌ Failed to connect to TAXII server: {e}", file=sys.stderr)
            sys.exit(1)

        if not api_roots:
            print("❌ No API roots found from TAXII server", file=sys.stderr)
            sys.exit(1)

        api_root = api_roots[0]
        print(f"✅ Using API root: {api_root.url}")

        # Log available collections
        print("\n📚 Available collections:")
        for coll in api_root.collections:
            print(f"   • {coll.title} (ID: {coll.id})")

        # Select Enterprise ATT&CK collection (or fallback to first collection)
        collection = next(
            (c for c in api_root.collections if "Enterprise" in c.title),
            api_root.collections[0]
        )
        print(f"\n🎯 Selected collection: {collection.title}")

        # Fetch all objects from collection
        print("⬇️  Fetching objects from TAXII server...")
        objs = collection.get_objects().get("objects", [])
        print(f"✅ Fetched {len(objs)} total objects")

        # Filter by object type
        tactics = [o for o in objs if o.get("type") == "x-mitre-tactic"]
        techniques = [o for o in objs if o.get("type") == "attack-pattern"]
        relationships = [o for o in objs if o.get("type") == "relationship"]

        print(f"\n📊 Extracted:")
        print(f"   • Tactics:        {len(tactics)}")
        print(f"   • Techniques:     {len(techniques)}")
        print(f"   • Relationships:  {len(relationships)}")

        return tactics, techniques, relationships

    def save_to_pickle(self, tactics: List[Dict], techniques: List[Dict], 
                       relationships: List[Dict]) -> None:
        """
        Save MITRE data to pickle files for fast loading.
        
        Args:
            tactics: List of tactic dictionaries
            techniques: List of technique dictionaries
            relationships: List of relationship dictionaries
        """
        print(f"\n💾 Saving data to pickle files...")

        with open(TACTICS_PATH, 'wb') as f:
            pickle.dump(tactics, f)
        print(f"   ✅ Saved tactics to {TACTICS_PATH}")

        with open(TECHNIQUES_PATH, 'wb') as f:
            pickle.dump(techniques, f)
        print(f"   ✅ Saved techniques to {TECHNIQUES_PATH}")

        with open(RELATIONSHIPS_PATH, 'wb') as f:
            pickle.dump(relationships, f)
        print(f"   ✅ Saved relationships to {RELATIONSHIPS_PATH}")

    def load_from_pickle(self) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Load MITRE data from cached pickle files.
        
        Returns:
            Tuple of (tactics, techniques, relationships)
            
        Raises:
            FileNotFoundError: If pickle files don't exist
        """
        print("📂 Loading data from pickle files...")

        if not all(p.exists() for p in [TACTICS_PATH, TECHNIQUES_PATH, RELATIONSHIPS_PATH]):
            raise FileNotFoundError(
                "❌ Pickle files not found. Run with --update flag to fetch from TAXII server."
            )

        with open(TECHNIQUES_PATH, 'rb') as f:
            techniques = pickle.load(f)
        print(f"   ✅ Loaded {len(techniques)} techniques")

        with open(TACTICS_PATH, 'rb') as f:
            tactics = pickle.load(f)
        print(f"   ✅ Loaded {len(tactics)} tactics")

        with open(RELATIONSHIPS_PATH, 'rb') as f:
            relationships = pickle.load(f)
        print(f"   ✅ Loaded {len(relationships)} relationships")

        return tactics, techniques, relationships

    def export_to_json(self, tactics: List[Dict], techniques: List[Dict], 
                       relationships: List[Dict]) -> None:
        """
        Export MITRE data to JSON files for human readability.
        
        Args:
            tactics: List of tactic dictionaries
            techniques: List of technique dictionaries
            relationships: List of relationship dictionaries
        """
        print("\n📄 Exporting to JSON format...")

        json_dir = DATA_DIR / "json_exports"
        json_dir.mkdir(exist_ok=True)

        # Export tactics
        tactics_json = json_dir / "tactics.json"
        with open(tactics_json, 'w') as f:
            json.dump(tactics, f, indent=2)
        print(f"   ✅ Exported tactics to {tactics_json}")

        # Export techniques
        techniques_json = json_dir / "techniques.json"
        with open(techniques_json, 'w') as f:
            json.dump(techniques, f, indent=2)
        print(f"   ✅ Exported techniques to {techniques_json}")

        # Export relationships
        relationships_json = json_dir / "relationships.json"
        with open(relationships_json, 'w') as f:
            json.dump(relationships, f, indent=2)
        print(f"   ✅ Exported relationships to {relationships_json}")

    def print_sample(self, techniques: List[Dict], tactics: List[Dict], 
                     relationships: List[Dict]) -> None:
        """
        Print sample data for verification.
        
        Args:
            techniques: List of technique dictionaries
            tactics: List of tactic dictionaries
            relationships: List of relationship dictionaries
        """
        print("\n🔍 Sample Data:")
        print("\n" + "=" * 80)
        print("SAMPLE RELATIONSHIP:")
        print("=" * 80)
        print(json.dumps(relationships[0], indent=2))

        print("\n" + "=" * 80)
        print("SAMPLE TECHNIQUE:")
        print("=" * 80)
        if techniques:
            sample_tech = techniques[0]
            # Extract MITRE ATT&CK ID
            ext_id = None
            for ref in sample_tech.get("external_references", []):
                if ref.get("source_name") == "mitre-attack":
                    ext_id = ref.get("external_id")
                    break
            print(f"ID: {ext_id or 'N/A'}")
            print(f"Name: {sample_tech.get('name')}")
            print(f"Description: {sample_tech.get('description', 'N/A')[:200]}...")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Sync MITRE ATT&CK data from TAXII server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch latest data from TAXII server and cache locally
  python sync_mitre.py --update
  
  # Load cached data from pickle files
  python sync_mitre.py --load
  
  # Export cached data to JSON format
  python sync_mitre.py --to-json
        """
    )
    
    parser.add_argument(
        '--update', 
        action='store_true',
        help='Fetch latest data from TAXII server and save to pickle files'
    )
    parser.add_argument(
        '--load', 
        action='store_true',
        help='Load data from cached pickle files'
    )
    parser.add_argument(
        '--to-json', 
        action='store_true',
        help='Export cached data to JSON format'
    )
    parser.add_argument(
        '--sample', 
        action='store_true',
        help='Print sample data for verification'
    )

    args = parser.parse_args()

    syncer = MITRESync()

    # If no arguments provided, show help
    if not any([args.update, args.load, args.to_json, args.sample]):
        parser.print_help()
        sys.exit(0)

    # Handle --update flag
    if args.update:
        tactics, techniques, relationships = syncer.fetch_from_taxii()
        syncer.save_to_pickle(tactics, techniques, relationships)
        print("\n✅ Update complete!")

    # Handle --load flag
    if args.load or args.to_json or args.sample:
        try:
            tactics, techniques, relationships = syncer.load_from_pickle()
        except FileNotFoundError as e:
            print(str(e), file=sys.stderr)
            sys.exit(1)

    # Handle --to-json flag
    if args.to_json:
        syncer.export_to_json(tactics, techniques, relationships)

    # Handle --sample flag
    if args.sample:
        syncer.print_sample(techniques, tactics, relationships)


if __name__ == "__main__":
    main()
