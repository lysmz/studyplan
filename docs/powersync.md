flowchart LR
    UI["App UI"] -->|writes| Local[("Local PowerSync SQLite")]
    Local -->|captures change| Queue["Persistent upload queue"]
    Queue -->|SDK calls uploadData| Connector["Your connector code"]
    Connector -->|Supabase API call| Supabase[("Supabase Postgres")]
    Supabase -->|database replication| Service["PowerSync service"]
    Service -->|downloads selected changes| Local
    Local -->|reads| UI