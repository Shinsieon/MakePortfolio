from django.db import models

class USERTBL(models.Model):
    name = models.CharField(max_length=20)
    email = models.CharField(max_length=50, primary_key=True)
    password = models.CharField(max_length=100)
    image = models.TextField()
    gender = models.CharField(max_length=10)
    age_range = models.CharField(max_length=20)
    is_super = models.BooleanField
    class Meta:
        managed = False
        db_table = 'USERTBL'

class USERASSET(models.Model):
    email = models.CharField(max_length=20)
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=20)
    weight = models.FloatField()
    amount = models.FloatField()
    investmentperiod = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'USERASSET'
    
    