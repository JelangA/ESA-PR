from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("CSV_TO_PARQUET_PARTITIONED") \
    .getOrCreate()

# Baca file CSV dari path lokal container spark-master
df = spark.read.csv(
    "/data/sales.csv",
    header=True,
    inferSchema=True
)

# Transformasi sederhana: hapus baris duplikasi
df_clean = df.dropDuplicates()

# Simpan sebagai format Parquet ke HDFS dengan partisi berdasarkan transaction_date
df_clean.write \
    .mode("overwrite") \
    .partitionBy("transaction_date") \
    .parquet("hdfs://hive-namenode:8020/data/parquet/sales_partitioned")

print("ETL PARTITIONED SUCCESS")
spark.stop()
