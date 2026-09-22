from datetime import date

from rest_framework import serializers

from academics.models import SchoolClass

from .models import FeePayment, FeeStructure


class FeeStructureSerializer(serializers.ModelSerializer):
    class_label = serializers.SerializerMethodField()

    class Meta:
        model = FeeStructure
        fields = ["id", "school_class", "class_label", "amount"]
        extra_kwargs = {"school_class": {"required": True, "allow_null": False}}

    def get_class_label(self, obj):
        return str(obj.school_class) if obj.school_class_id else obj.class_name

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("The fee must be more than zero.")
        return value


class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = FeePayment
        fields = ["id", "student", "student_name", "amount", "due_date", "status", "paid_on"]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("The amount must be more than zero.")
        return value

    def validate(self, attrs):
        # Paid challans always carry a payment date; pending ones never do.
        current = self.instance
        status = attrs.get("status", current.status if current else FeePayment.Status.PENDING)
        if status == FeePayment.Status.PAID:
            paid_on = attrs.get("paid_on", current.paid_on if current else None)
            attrs["paid_on"] = paid_on or date.today()
        else:
            attrs["paid_on"] = None
        return attrs


class GenerateChallansSerializer(serializers.Serializer):
    school_class = serializers.PrimaryKeyRelatedField(
        queryset=SchoolClass.objects.all(), required=False, allow_null=True
    )
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=1, required=False, allow_null=True
    )
    due_date = serializers.DateField()