import Vue from 'vue'
import Router from 'vue-router'

/* Layout */
import Layout from '@/layout'
import store from '@/store'
// 动态路由
Vue.use(Router)
// 动态路由表
export const asyncRoutes = [
  {
    path: '/park',
    component: Layout,
    permission: 'park',
    meta: { title: '园区管理', icon: 'el-icon-office-building' },
    children: [{
      path: 'building',
      permission: 'park:building',
      meta: { title: '楼宇管理' },
      component: () => import('@/views/Park/Building/index')
    },
    {
      path: 'enterprise',
      permission: 'park:enterprise',
      meta: { title: '企业管理' },
      component: () => import('@/views/Park/Enterprise/index')
    }]
  },

  {
    path: '/parking',
    component: Layout,
    permission: 'parking',
    meta: { title: '行车管理', icon: 'el-icon-guide' },
    children: [{
      path: 'area',
      permission: 'parking:area',
      component: () => import('@/views/Car/CarArea'),
      meta: { title: '区域管理' }
    }, {
      path: 'card',
      permission: 'parking:card',
      component: () => import('@/views/Car/CarCard'),
      meta: { title: '月卡管理' }
    }, {
      path: 'pay',
      permission: 'parking:payment',
      component: () => import('@/views/Car/CarPay'),
      meta: { title: '停车缴费管理' }
    },
    {
      path: 'rule',
      permission: 'parking:rule',
      component: () => import('@/views/Car/CarRule'),
      meta: { title: '计费规则管理' }
    }]
  },
  {
    path: '/pole',
    component: Layout,
    permission: 'pole',
    meta: { title: '一体杆管理', icon: 'el-icon-refrigerator' },
    children: [{
      path: 'info',
      permission: 'pole:info',
      component: () => import('@/views/Rod/RodManage'),
      meta: { title: '一体杆管理' }
    }, {
      path: 'waring',
      permission: 'pole:warning',
      component: () => import('@/views/Rod/RodWarn'),
      meta: { title: '告警记录' }
    }]
  },
  {
    path: '/sys',
    component: Layout,
    permission: 'sys',
    meta: { title: '系统管理', icon: 'el-icon-setting' },
    children: [{
      path: 'role',
      permission: 'sys:role',
      component: () => import('@/views/System/Role/index'),
      meta: { title: '角色管理' }
    }, {
      path: 'user',
      permission: 'sys:user',
      component: () => import('@/views/System/Employee/index'),
      meta: { title: '员工管理' }
    }]
  },
  {
    path: '/propety',
    component: Layout,
    children: [{
      // 注意：这里路径字符串为空，代表一级菜单无二级菜单
      path: '',
      name: 'cost',
      // 二级路由点，要挂载的组件
      component: () => import('@/views/Propety/index'),
      // 左侧路由上标题和图标（图标使用 element-ui 组件库里图标类名（因为左侧导航组件是基于 element-ui 组件库）
      meta: { title: '物业费管理', icon: 'el-icon-wallet' }
    }]
  }
]
// 静态路由
export const routes = [
  {
    path: '/login',
    component: () => import('@/views/Login/index'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/login'
  },
  {
    path: '/workbench',
    component: Layout,
    permission: 'workbench',
    children: [{
      path: '',
      component: () => import('@/views/Workbench/index'),
      meta: { title: '工作台', icon: 'el-icon-data-board' }
    }]
  },
  {
    path: '/cardAdd',
    component: () => import('@/views/Car/CarCard/add-card')
  },
  {
    path: '/roleAdd',
    component: () => import('@/views/System/Role/add')
  },
  {
    path: '/exterpriseAdd',
    component: () => import('@/views/Park/Enterprise/add')
  },
  {
    path: '/exterpriseDetail',
    component: () => import('@/views/Park/Enterprise/detail')// 查看企业
  },
  {
    path: '/viewMonthCard',
    component: () => import('@/views/Car/CarCard/viewMonthCard')// 查看月卡
  }

]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  routes: routes
})

const router = createRouter()

// 重置路由方法
export function resetRouter() {
  // 得到一个全新的router实例对象
  const newRouter = createRouter()
  // 使用新的路由记录覆盖掉老的路由记录
  router.matcher = newRouter.matcher
}
router.beforeEach(
  async(to, from, next) => {
    const token = store.state.user.token
    const white = ['/login']
    if (token) {
      next()
      if (!store.state.user.profile.id) {
        const UserRouter = []
        // 获取用户权限列表
        const res = await store.dispatch('user/getProfile')
        // 处理数据
        const newPermissions = []
        res.data.permissions.forEach(item => {
          newPermissions.push(item.split(':')[0])
        })

        const firstPerList = Array.from(new Set(newPermissions))
        const routerArr = asyncRoutes.filter(item => {
          return firstPerList.includes(item.permission)
        })
        console.log(routerArr)
        if (firstPerList[0] === '*') {
          UserRouter.push(...asyncRoutes)
          UserRouter.push(...routes)
          const arr = [...asyncRoutes]
          arr.push({
            path: '*',
            component: () => import('@/views/404'),
            hidden: true
          })
          store.commit('user/setUserRouer', UserRouter)
          arr.forEach(item => {
            router.addRoute(item)
          })
        } else {
          // 二级路由
          let secondList = res.data.permissions.map(item => {
            const arr = item.lastIndexOf(':')
            const secondStr = item.substr(0, arr)
            return secondStr
          })

          secondList = Array.from(new Set(secondList))
          const newsecondList = routerArr.map(item => {
            const resArr = item.children.filter(item => {
              return secondList.includes(item.permission)
            })
            const newsecondObj = { ...item }
            newsecondObj.children = resArr
            return newsecondObj
          })
          UserRouter.push(...newsecondList)
          UserRouter.push(...routes)
          store.commit('user/setUserRouer', UserRouter)
          // 问题:点击筛选后的路由对象，跳转不了
          // -原因:new Router 时 routes 里只有静态的路由规则对象，匹配的只有这些静态的
          // 动态:网络请求回来在给 routes 数组本身添加，影响不了 router 路由对象里使用的路由规则
          // 解决:router 给我们一个 addRoute 方法可以动态追加可以““匹配”用的路由对象

          newsecondList.forEach(item => {
            router.addRoute(item)
          })
        }
      }
    } else {
      if (white.includes(to.path)) {
        next()
      } else {
        next('/login')
      }
    }
  })

export default router
