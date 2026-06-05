from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("CSV_TO_PARQUET") \
    .getOrCreate()

# Baca file CSV dari path lokal container spark-master
df = spark.read.csv(
    "/data/sales.csv",
    header=True,
    inferSchema=True
)

# Transformasi sederhana: hapus baris duplikasi
df_clean = df.dropDuplicates()

# Simpan sebagai format Parquet ke HDFS
df_clean.write.mode("overwrite").parquet(
    "hdfs://hive-namenode:8020/data/parquet/sales"
)

print("ETL SUCCESS")
spark.stop()
