<template>
  <div class="add-card">
    <header class="add-header">
      <el-page-header :content="title" @back="$router.back()" />
    </header>
    <main class="add-main">
      <div class="form-container">
        <div class="title">车辆信息</div>
        <div class="form">
          <el-form ref="carInfoForm" :model="carInfoForm" :rules="carInfoRules" label-width="100px">
            <el-form-item label="车主姓名" prop="personName">
              <el-input v-model="carInfoForm.personName" :disabled="disabledData" />
            </el-form-item>
            <el-form-item label="联系方式" prop="phoneNumber">
              <el-input v-model="carInfoForm.phoneNumber" :disabled="disabledData" />
            </el-form-item>
            <el-form-item label="车辆号码" prop="carNumber">
              <el-input v-model="carInfoForm.carNumber" :disabled="disabledData" />
            </el-form-item>
            <el-form-item label="车辆品牌" prop="carBrand">
              <el-input v-model="carInfoForm.carBrand" :disabled="disabledData" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div class="form-container">
        <div class="title">最新一次月卡缴费信息</div>
        <div class="form">
          <el-form ref="feeForm" :model="feeForm" :rules="feeFormRules" label-width="100px">
            <el-form-item label="有效日期" prop="payTime">
              <el-date-picker
                v-model="feeForm.payTime"
                value-format="yyyy-MM-dd"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item label="支付金额" prop="paymentAmount">
              <el-input v-model="feeForm.paymentAmount" />
            </el-form-item>
            <el-form-item label="支付方式" prop="paymentMethod">
              <el-select v-model="feeForm.paymentMethod" clearable>
                <el-option
                  v-for="item in payMethodList"
                  :key="item.id"
                  :value="item.id"
                  :label="item.name"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

    </main>
    <footer class="add-footer">
      <div class="btn-container">
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="confirmAdd">确定</el-button>
      </div>
    </footer>
  </div>
</template>

<script>
import { validaeCarNumber, validaeChineseName, validaePhone } from '@/utils/validate'
import { addCard, getCardDetailAPI, updateCardAPI, CarRechargeAPI } from '@/apis/car'
export default {
  data() {
    return {
      // 车辆信息表单
      carInfoForm: {
        personName: '', // 车主姓名
        phoneNumber: '', // 联系方式
        carNumber: '', // 车牌号码
        carBrand: '' // 车辆品牌
      },
      carInfoRules: {
        personName: [
          {
            required: true, message: '请输入车主姓名', trigger: 'blur'
          },
          { validator: this.CheckFunction, trigger: 'blur' }
        ],
        phoneNumber: [
          {
            required: true, message: '请输入联系方式', trigger: 'blur'
          },
          { validator: this.CheckFunction, trigger: 'blur' }
        ],
        carNumber: [
          {
            required: true, message: '请输入车辆号码', trigger: 'blur'
          },
          { validator: this.CheckFunction, trigger: 'blur' }
        ],
        carBrand: [
          {
            required: true, message: '请输入车辆品牌', trigger: 'blur'
          }

        ]
      },
      feeForm: {
        payTime: [], // 支付时间
        paymentAmount: null, // 支付金额
        paymentMethod: null // 支付方式
        // rechargeId: '',
        // carInfoId: ''
      },
      // 缴费规则
      feeFormRules: {
        payTime: [
          {
            required: true,
            message: '请选择支付时间'
          }
        ],
        paymentAmount: [
          {
            required: true,
            message: '请输入支付金额',
            trigger: 'blur'
          }
        ],
        paymentMethod: [
          {
            required: true,
            message: '请选择支付方式',
            trigger: 'change'
          }
        ]
      },
      // 支付方式列表
      payMethodList: [
        {
          id: 'Alipay',
          name: '支付宝'
        },
        {
          id: 'WeChat',
          name: '微信'
        },
        {
          id: 'Cash',
          name: '线下'
        }
      ],
      // 输入框是否禁止使用
      disabledData: false,
      // 月卡车辆id
      carId: ''

    }
  },
  computed: {
    title() {
      if (this.$route.query.type && this.$route.query.id) {
        return '续费月卡'
      } else if (this.$route.query.id) {
        return '编辑月卡'
      } else {
        return '新增月卡'
      }
    }
  },

  created() {
    if (this.$route.query.type && this.$route.query.id) {
      this.getCarList()
      this.disabledData = true
    } else if (this.$route.query.id) {
      this.getCarList()
    }
  },
  methods: {
    CheckFunction(rule, value, callback) {
      if (rule.field === 'carNumber') {
        if (validaeCarNumber(value)) callback()
        else callback(new Error('请输入正确的车牌号'))
      } else if (rule.field === 'personName') {
        if (validaeChineseName(value)) callback()
        else callback(new Error('请输入正确的中文姓名'))
      } else if (rule.field === 'phoneNumber') {
        if (validaePhone(value)) callback()
        else callback(new Error('请输入正确的手机号码'))
      }
    },
    async confirmAdd() {
      await this.$refs.carInfoForm.validate()
      await this.$refs.feeForm.validate()
      const obj = {
        ... this.carInfoForm,
        ...this.feeForm
      }
      obj.cardStartDate = obj.payTime[0]
      obj.cardEndDate = obj.payTime[1]
      delete obj.payTime
      if (this.$route.query.type && this.$route.query.id) {
        const { cardStartDate, cardEndDate, paymentAmount, paymentMethod, carInfoId } = obj
        const CarRechargeObj = { cardStartDate, cardEndDate, paymentAmount, paymentMethod, carInfoId }
        await CarRechargeAPI(CarRechargeObj)
      } else if (this.$route.query.id) {
        await updateCardAPI(obj)
      } else {
        await addCard(obj)
      }

      this.$router.back()
    },
    async getCarList() {
      const res = await getCardDetailAPI(this.$route.query.id)
      for (const key in this.carInfoForm) {
        this.carInfoForm[key] = res.data[key]
      }
      for (const key in this.feeForm) {
        if (key === 'payTime') {
          const { cardEndDate, cardStartDate } = res.data
          this.feeForm.payTime = [cardStartDate, cardEndDate]
        } else {
          this.feeForm[key] = res.data[key]
        }
      }
      this.feeForm.rechargeId = res.data.rechargeId
      this.feeForm.carInfoId = res.data.carInfoId
    },

    reset() {
      this.$refs.carInfoForm.resetFields()
      this.$refs.feeForm.resetFields()
    }

  }
}
</script>

  <style scoped lang="scss">
  .add-card {
    background-color: #f4f6f8;
    height: 100vh;

    .add-header {
      display: flex;
      align-items: center;
      padding: 0 20px;
      height: 64px;
      background-color: #fff;

      .left {
        span {
          margin-right: 4px;
        }
        .arrow{
          cursor: pointer;
        }
      }

      .right {
        text-align: right;
      }
    }

    .add-main {
      background: #f4f6f8;
      padding: 20px 130px;

      .form-container {
        background-color: #fff;

        .title {
          height: 60px;
          line-height: 60px;
          padding-left: 20px;
        }

        .form {
          margin-bottom: 20px;
          padding: 20px 65px 24px;

          .el-form {
            display: flex;
            flex-wrap: wrap;

            .el-form-item {
              width: 50%;
            }
          }
        }
      }
      .preview{
        img{
          width: 100px;
        }
      }
    }

    .add-footer {
      position: fixed;
      bottom: 0;
      width: 100%;
      padding: 24px 50px;
      color: #000000d9;
      font-size: 14px;
      background: #fff;
      text-align: center;
    }
  }
  </style>
